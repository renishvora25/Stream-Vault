import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import asyncHandler  from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid video ID"
        });
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    let isLiked;
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        isLiked = false;
    } else {
        await Like.create({
            video: videoId,
            likedBy: req.user._id
        });
        isLiked = true;
    }

    // Return updated like count alongside isLiked flag
    const likeCount = await Like.countDocuments({ video: videoId });

    return res.status(200).json({
        success: true,
        data: { isLiked, likeCount },
        message: isLiked ? "Liked video successfully" : "Removed like from video"
    });
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid comment ID"
        });
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json({
            success: true,
            data: { isLiked: false },
            message: "Removed like from comment"
        });
    } else {
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        });
        return res.status(200).json({
            success: true,
            data: { isLiked: true },
            message: "Liked comment successfully"
        });
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid tweet ID"
        });
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json({
            success: true,
            data: { isLiked: false },
            message: "Removed like from tweet"
        });
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        });
        return res.status(200).json({
            success: true,
            data: { isLiked: true },
            message: "Liked tweet successfully"
        });
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: { $exists: true, $ne: null }
    }).populate({
        path: "video",
        populate: {
            path: "owner",
            select: "fullName username avatar"
        }
    });

    const formattedVideos = likedVideos.map(like => like.video).filter(Boolean);

    return res.status(200).json({
        success: true,
        data: formattedVideos,
        message: "Liked videos fetched successfully"
    });
})

/**
 * GET /count/v/:videoId
 * Returns: { likeCount, isLiked } — isLiked is true if the logged-in user liked this video.
 * Requires auth (verifyJWT).
 */
const getVideoLikeStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid video ID"
        });
    }

    // Run both queries in parallel for speed
    const [likeCount, userLike] = await Promise.all([
        Like.countDocuments({ video: new mongoose.Types.ObjectId(videoId) }),
        Like.findOne({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: req.user._id
        })
    ]);

    return res.status(200).json({
        success: true,
        data: {
            likeCount,
            isLiked: !!userLike
        },
        message: "Like status fetched successfully"
    });
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikeStatus
}