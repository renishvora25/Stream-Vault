import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import asyncHandler  from "../utils/asyncHandler.js"

/**
 * POST /c/:channelId
 * Toggle subscription to a channel. Returns { isSubscribed, subscriberCount }.
 */
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid channel ID" 
        });
    }

    if (channelId.toString() === req.user._id.toString()) {
        return res.status(400).json({ 
            success: false, 
            message: "You cannot subscribe to your own channel" 
        });
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    let isSubscribed;
    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        isSubscribed = false;
    } else {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        isSubscribed = true;
    }

    // Return updated subscriber count alongside status
    const subscriberCount = await Subscription.countDocuments({ channel: channelId });

    return res.status(200).json({
        success: true,
        data: { isSubscribed, subscriberCount },
        message: isSubscribed ? "Subscribed successfully" : "Unsubscribed successfully"
    });
})

/**
 * GET /u/:channelId
 * Get all subscribers of a channel.
 */
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid channel ID" 
        });
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "fullName username avatar");

    return res.status(200).json({
        success: true,
        data: subscribers,
        message: "Subscribers fetched successfully"
    });
})

/**
 * GET /c/:channelId
 * Get all channels a user (channelId = userId here) is subscribed to.
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid subscriber ID" 
        });
    }

    const subscribedChannels = await Subscription.find({ subscriber: channelId })
        .populate("channel", "fullName username avatar");

    return res.status(200).json({
        success: true,
        data: subscribedChannels,
        message: "Subscribed channels fetched successfully"
    });
})

/**
 * GET /status/:channelId
 * Check if the logged-in user is subscribed to a specific channel.
 * Returns { isSubscribed, subscriberCount } — single DB call via Promise.all.
 */
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid channel ID" 
        });
    }

    const [existingSub, subscriberCount] = await Promise.all([
        Subscription.findOne({
            subscriber: req.user._id,
            channel: new mongoose.Types.ObjectId(channelId)
        }),
        Subscription.countDocuments({ channel: new mongoose.Types.ObjectId(channelId) })
    ]);

    return res.status(200).json({
        success: true,
        data: {
            isSubscribed: !!existingSub,
            subscriberCount
        },
        message: "Subscription status fetched successfully"
    });
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    getSubscriptionStatus
}