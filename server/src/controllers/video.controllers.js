import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import asyncHandler  from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    
    const pipeline = [];

    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        pipeline.push({
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        });
    }

    pipeline.push({ $match: { isPublished: true } });

    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
    pipeline.push({ $sort: sortOptions });

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                "owner.password": 0,
                "owner.refreshToken": 0
            }
        }
    );

    const videoAggregate = Video.aggregate(pipeline);
    
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videos = await Video.aggregatePaginate(videoAggregate, options);

    return res.status(200).json({
        success: true,
        data: videos,
        message: "Videos fetched successfully"
    });
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
        return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        return res.status(400).json({ success: false, message: "Video file is required" });
    }
    if (!thumbnailLocalPath) {
        return res.status(400).json({ success: false, message: "Thumbnail is required" });
    }

    const videoUpload = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoUpload?.url) {
        return res.status(500).json({ success: false, message: "Error uploading video to Cloudinary" });
    }
    if (!thumbnailUpload?.url) {
        return res.status(500).json({ success: false, message: "Error uploading thumbnail to Cloudinary" });
    }

    const newVideo = await Video.create({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: videoUpload.duration || 0, 
        isPublished: true,
        owner: req.user._id
    });

    return res.status(201).json({
        success: true,
        data: newVideo,
        message: "Video published successfully"
    });
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        return res.status(400).json({ success: false, message: "Invalid video ID" });
    }

    const video = await Video.findById(videoId).populate("owner", "fullName username avatar");

    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found" });
    }

    // Add to watch history if user is logged in
    if (req.user) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: { watchHistory: videoId }
            }
        );
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: { watchHistory: videoId }
            }
        );
    }

    return res.status(200).json({
        success: true,
        data: video,
        message: "Video fetched successfully"
    });
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        return res.status(400).json({ success: false, message: "Invalid video ID" });
    }

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found" });
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "You do not have permission to edit this video" });
    }

    let thumbnailUrl = video.thumbnail;
    const thumbnailLocalPath = req.file?.path; 

    if (thumbnailLocalPath) {
        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!newThumbnail?.url) {
            return res.status(500).json({ success: false, message: "Error uploading new thumbnail" });
        }
        
        if (thumbnailUrl) {
            const publicId = thumbnailUrl.split('/').pop().split('.')[0];
            await deleteFromCloudinary(publicId);
        }
        thumbnailUrl = newThumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: { 
                title: title || video.title, 
                description: description || video.description, 
                thumbnail: thumbnailUrl 
            }
        },
        { new: true }
    );

    return res.status(200).json({
        success: true,
        data: updatedVideo,
        message: "Video updated successfully"
    });
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        return res.status(400).json({ success: false, message: "Invalid video ID" });
    }

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found" });
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "You do not have permission to delete this video" });
    }

    if (video.videoFile) {
        const videoPublicId = video.videoFile.split('/').pop().split('.')[0];
        await deleteFromCloudinary(videoPublicId, "video"); 
    }
    if (video.thumbnail) {
        const thumbPublicId = video.thumbnail.split('/').pop().split('.')[0];
        await deleteFromCloudinary(thumbPublicId);
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json({
        success: true,
        data: {},
        message: "Video deleted successfully"
    });
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        return res.status(400).json({ success: false, message: "Invalid video ID" });
    }

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found" });
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "You do not have permission to toggle this status" });
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res.status(200).json({
        success: true,
        data: { isPublished: video.isPublished },
        message: "Publish status toggled"
    });
})

const getSubscribedVideos = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id;

    const subscriptions = await Subscription.find({ subscriber: subscriberId });
    
    const subscribedChannelIds = subscriptions.map(sub => sub.channel);

    const videos = await Video.find({
        owner: { $in: subscribedChannelIds },
        isPublished: true
    })
    .populate("owner", "fullName username avatar")
    .sort({ createdAt: -1 })
    .limit(50);

    return res.status(200).json({
        success: true,
        data: videos,
        message: "Subscribed videos fetched successfully"
    });
})

const incrementVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        return res.status(400).json({ success: false, message: "Invalid video ID" });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    );

    // Add to watch history if user is logged in
    if (req.user) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: { watchHistory: videoId }
            }
        );
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $push: { watchHistory: videoId }
            }
        );
    }

    return res.status(200).json({
        success: true,
        data: updatedVideo,
        message: "Views incremented successfully"
    });
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getSubscribedVideos,
    incrementVideoViews
}