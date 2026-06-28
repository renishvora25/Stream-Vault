import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import asyncHandler  from "../utils/asyncHandler.js"
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({
            success: false,
            message: "Name and description are required"
        });
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
        videos: []
    });

    if (!playlist) {
        return res.status(500).json({
            success: false,
            message: "Failed to create playlist"
        });
    }

    return res.status(201).json({
        success: true,
        data: playlist,
        message: "Playlist created successfully"
    });
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    // Use aggregation to get playlist + count + cover thumbnail in one query
    const playlists = await Playlist.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        {
            // Lookup only the first video to get its thumbnail
            $lookup: {
                from: "videos",
                let: { videoIds: "$videos" },
                pipeline: [
                    { $match: { $expr: { $in: ["$_id", { $ifNull: ["$$videoIds", []] }] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    { $project: { thumbnail: 1, title: 1 } }
                ],
                as: "firstVideoData"
            }
        },
        {
            $addFields: {
                videoCount: { $size: { $ifNull: ["$videos", []] } },
                coverThumbnail: { $arrayElemAt: ["$firstVideoData.thumbnail", 0] },
                coverTitle: { $arrayElemAt: ["$firstVideoData.title", 0] }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videoCount: 1,
                coverThumbnail: 1,
                coverTitle: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                videos: 1 // We need videos array to check if a video is inside the playlist
            }
        }
    ]);

    return res.status(200).json({
        success: true,
        data: playlists,
        message: "User playlists fetched successfully"
    });
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid playlist ID"
        });
    }

    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            populate: {
                path: "owner",
                select: "fullName username avatar"
            }
        })
        .populate("owner", "fullName username avatar");

    if (!playlist) {
        return res.status(404).json({
            success: false,
            message: "Playlist not found"
        });
    }

    return res.status(200).json({
        success: true,
        data: playlist,
        message: "Playlist fetched successfully"
    });
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid playlist or video ID"
        });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        return res.status(404).json({
            success: false,
            message: "Playlist not found"
        });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to add videos to this playlist"
        });
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } },
        { new: true }
    );

    return res.status(200).json({
        success: true,
        data: updatedPlaylist,
        message: "Video added to playlist successfully"
    });
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid playlist or video ID"
        });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        return res.status(404).json({
            success: false,
            message: "Playlist not found"
        });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to remove videos from this playlist"
        });
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    );

    return res.status(200).json({
        success: true,
        data: updatedPlaylist,
        message: "Video removed from playlist successfully"
    });
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid playlist ID"
        });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        return res.status(404).json({
            success: false,
            message: "Playlist not found"
        });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to delete this playlist"
        });
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json({
        success: true,
        data: {},
        message: "Playlist deleted successfully"
    });
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid playlist ID"
        });
    }

    if (!name && !description) {
        return res.status(400).json({
            success: false,
            message: "At least one field (name or description) is required to update"
        });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        return res.status(404).json({
            success: false,
            message: "Playlist not found"
        });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to update this playlist"
        });
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name || playlist.name,
                description: description || playlist.description
            }
        },
        { new: true }
    );

    return res.status(200).json({
        success: true,
        data: updatedPlaylist,
        message: "Playlist updated successfully"
    });
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}