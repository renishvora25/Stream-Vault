import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); 

// Specific static-prefix routes MUST come before the generic /:playlistId route
// otherwise Express matches /:playlistId for /add/..., /remove/..., /user/...
router.route("/").post(createPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

// Generic /:playlistId LAST — so it doesn't swallow the routes above
router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

export default router