import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
    getSubscriptionStatus,
} from "../controllers/subscription.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); 

// Toggle or fetch subscribed channels for a user (GET = subscribed channels list, POST = toggle)
router
    .route("/c/:channelId")
    .get(getSubscribedChannels)
    .post(toggleSubscription);

// Get all subscribers of a channel
router.route("/u/:channelId").get(getUserChannelSubscribers);

// Check if the logged-in user is subscribed to :channelId — returns { isSubscribed, subscriberCount }
router.route("/status/:channelId").get(getSubscriptionStatus);

export default router