import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";

const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
    }catch(error){
        throw new Error("Something went wrong while generating tokens")
    }
}

const userRegister = asyncHandler( async (req,res) => {
    
    const {username,email,fullname,password} = req.body;   //get data from frontend

    if([username,email,fullname,password].some((field) => field?.trim() === "")){    
        return res.status(400).json({
            success : false,
            message : "All fields are required"
        })
    }

    //if user exist or not
    const existUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(existUser){
        return res.status(409).json({
        success: false,
        message: "Username already exists"
        })
    }
    
    const avatarLocal = req.files?.avatar?.[0]?.path;
    const coverImageLocal = req.files?.coverImage?.[0]?.path;   

    if(!avatarLocal){
        return res.status(400).json({
            message : "Avatar is required"
        })
    }

    const avatar = await uploadOnCloudinary(avatarLocal);
    let coverImage;
    if (coverImageLocal) {
        coverImage = await uploadOnCloudinary(coverImageLocal);
    }

    if(!avatar){
        return res.status(400).json({
            message : "Avatar is required"
        })
    }

   const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        return res.status(500).json({
            message : "Something went wrong ,please try again!"
        })
    }

    return res.status(201).json({
        success : true,
        message : "User created successfully",
        user : createdUser
    })
 })


const loginUser = asyncHandler(async (req,res) => {
    const {username, email, password} = req.body;

    if(!username && !email){
        return res.status(400).json({
            message : "username or email is required"
        })
    }

    const user =await User.findOne({
        $or : [{email},{username}]
    })

    if(!user){
        return res.status(404).json({
            message : "User does not exist"
        })
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        return res.status(401).json({
            message : "Invalid Credential"
        })
    }

    const {accessToken, refreshToken} = await generateTokens(user._id)

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json({
        message : "User logged in successfully!"
    })
})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json({
        message : "User logged out sucessfully!"
    })
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        return res.status(401).json({
            message : "Unauthorized Request"
        })
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            return res.status(401).json({
                message : "Invalid Refresh Token"
            })
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json({
                message : "Refresh token is expired or used"
            })            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateTokens(user._id)
    
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options)
        .json({
                message : "Access token refreshed"
            }
        )
    } catch (error) {
        return res.status(401).json({
            message : error.message
        })
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confPassword} = req.body

    if(newPassword!=confPassword){
        return res.status(400).json({
            message : "New password and Confirm password should be same"
        })
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        return res.status(400).json({
            message : "Invalid Old Password"
        })
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json({
        message : "Password changed successfully"
    })
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json({
        user : req.user,
        message : "User fetched successfully"
    })
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        return res.status(400).json({
            message : "All fields are requied"
        })
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res.status(200).json({
        user : user,
        message : "Account detailes updated successfully"
    })
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        return res.status(400).json({
            message : "Avatar file is missing"
        })
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        return res.status(400).json({
            message : "Error while uploading avatar"
        })
        
    }

    const oldAvatarUrl = req.user?.avatar;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    if (oldAvatarUrl) {
        const publicId = oldAvatarUrl.split('/').pop().split('.')[0]; 
        await deleteFromCloudinary(publicId);
    }

    return res.status(200).json({
        user : user,
        message : "Avatar image updated successfully"
    })
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        return res.status(400).json({
            message : "Cover image file is missing"
        })
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        return res.status(400).json({
            message : "Error while uploading Cover file" // Fixed missing quote here!
        })
        
    }

    const oldCoverImageUrl = req.user?.coverImage;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    if (oldCoverImageUrl) {
        const publicId = oldCoverImageUrl.split('/').pop().split('.')[0]; 
        await deleteFromCloudinary(publicId);
    }

    return res.status(200).json({
        user : user,
        message : "Cover image updated successfully"
    })
})


const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        return res.status(400).json({
            message : "User is missing"
        })
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "followers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "following"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$followers"
                },
                channelsSubscribedToCount: {
                    $size: "$following"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$followers.subscriber"]}, 
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if (!channel?.length) {
        return res.status(404).json({
            message : "Channel does not exist"
        })
    }

    return res.status(200).json({
        statusCode: 200,
        data: channel[0],
        message: "User channel fetched successfully",
        success: true
    });
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if (!user?.length) {
        return res.status(404).json({
            message: "User not found or watch history unavailable"
        });
    }

    return res.status(200).json({
        statusCode: 200,
        data: user[0].watchHistory,
        message: "Watch history fetched successfully",
        success: true
    });
})


const searchUsers = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
        return res.status(200).json({ success: true, data: [], message: "No query provided" });
    }

    const regex = new RegExp(q.trim(), 'i'); // case-insensitive partial match

    const users = await User.find({
        $or: [
            { username: regex },
            { fullname: regex }
        ]
    })
    .select('username fullname avatar')
    .limit(8)
    .lean();

    return res.status(200).json({
        success: true,
        data: users,
        message: "Users found"
    });
})

export {
    userRegister,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    searchUsers
}
