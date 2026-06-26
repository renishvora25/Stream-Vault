import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    getSubscribedVideos,
    incrementVideoViews
} from "../controllers/video.controllers.js"
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middlewares.js"

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Static routes MUST come before dynamic /:videoId routes
// otherwise Express will match /:videoId for /subscriptions, /toggle/publish/...
// ─────────────────────────────────────────────────────────────────────────────

// Static routes first
router.route("/subscriptions").get(verifyJWT, getSubscribedVideos);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

// Public + authenticated browse/create
router.route("/").get(optionalAuth, getAllVideos).post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
);

// Dynamic /:videoId routes LAST so they don't swallow the static ones above
router.route("/:videoId/views").patch(optionalAuth, incrementVideoViews);

router
    .route("/:videoId")
    .get(optionalAuth, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

export default router