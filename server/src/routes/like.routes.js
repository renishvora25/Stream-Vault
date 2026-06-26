import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getVideoLikeStatus,
} from "../controllers/like.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

// All routes require a logged-in user
router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

// Returns { likeCount, isLiked } for a video — single DB call, requires auth
router.route("/status/v/:videoId").get(getVideoLikeStatus);

export default router