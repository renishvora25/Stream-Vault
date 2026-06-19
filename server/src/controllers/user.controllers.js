import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import uploadCloudinry from "../utils/cloudinary.js";

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

    if([username,email,fullname,password].some((field) => field.trim() === "")){    
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

    const avatar = await uploadCloudinry(avatarLocal);
    const coverImage = await uploadCloudinry(coverImageLocal);

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
            $set : {
                refreshToken : undefined
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

export { userRegister, loginUser, logoutUser, refreshAccessToken}