import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaThumbsUp, FaCommentAlt, FaBell, FaBookmark, FaTimes, FaPlus } from 'react-icons/fa';

export default function Watch() {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [viewCount, setViewCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showCommentActions, setShowCommentActions] = useState(false);

  // Like state — sourced directly from DB on load
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Subscription state — sourced directly from DB on load
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  // Playlist Modal
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=f3f4f6&color=374151';

  // ==========================================
  // DATA FETCHING
  // ==========================================

  useEffect(() => {
    const fetchWatchData = async () => {
      try {
        setLoading(true);

        // --- 1. Get current user (needed for status checks) ---
        // getCurrentUser controller returns: { user: req.user, message: "..." }
        // There is NO 'data' wrapper — read .user directly from the response body
        let loggedInUser = null;
        try {
          const userRes = await axios.get('/api/v1/users/current-user', { withCredentials: true });
          // Try every possible shape the API might return
          loggedInUser =
            userRes.data?.user ||        // { user, message }  ← actual shape
            userRes.data?.data?.user ||  // { data: { user } }
            userRes.data?.data ||        // { data: { _id, ... } }
            null;
          // Ensure it's a real user object with an _id
          if (!loggedInUser?._id) loggedInUser = null;
          setCurrentUser(loggedInUser);
        } catch (_) {
          // Not logged in — continue as guest
        }

        // --- 2. Fetch video + comments in parallel ---
        const [vidRes, commentRes] = await Promise.allSettled([
          axios.get(`/api/v1/videos/${videoId}`, { withCredentials: true }),
          axios.get(`/api/v1/comments/${videoId}`, { withCredentials: true }),
        ]);

        if (vidRes.status === 'rejected') {
          setError('This video is unavailable or has been removed.');
          return;
        }

        const fetchedVideo = vidRes.value.data?.data;
        if (!fetchedVideo) {
          setError('Video not found.');
          return;
        }
        setVideo(fetchedVideo);
        setViewCount((fetchedVideo.views || 0) + 1);
        // Increment views silently
        axios.patch(`/api/v1/videos/${videoId}/views`, {}, { withCredentials: true }).catch(() => {});

        if (commentRes.status === 'fulfilled') {
          const raw = commentRes.value.data?.data;
          setComments(Array.isArray(raw) ? raw : (raw?.docs || []));
        }

        // --- 3. Fetch interaction status (only if logged in) ---
        if (loggedInUser && fetchedVideo.owner?._id) {
          const channelId = fetchedVideo.owner._id.toString();

          // Both calls run in parallel — each is a single targeted DB query
          const [likeStatusRes, subStatusRes] = await Promise.allSettled([
            axios.get(`/api/v1/likes/status/v/${videoId}`, { withCredentials: true }),
            axios.get(`/api/v1/subscriptions/status/${channelId}`, { withCredentials: true }),
          ]);

          if (likeStatusRes.status === 'fulfilled') {
            const likeData = likeStatusRes.value.data?.data;
            setIsLiked(!!likeData?.isLiked);
            setLikeCount(likeData?.likeCount ?? 0);
          } else {
            console.warn('Like status fetch failed:', likeStatusRes.reason?.message);
          }

          if (subStatusRes.status === 'fulfilled') {
            const subData = subStatusRes.value.data?.data;
            setIsSubscribed(!!subData?.isSubscribed);
            setSubscriberCount(subData?.subscriberCount ?? 0);
          } else {
            console.warn('Subscription status fetch failed:', subStatusRes.reason?.message);
          }
        } else {
          // Guest: still fetch like count (no isLiked check needed)
          try {
            const likeStatusRes = await axios.get(`/api/v1/likes/status/v/${videoId}`, { withCredentials: true });
            setLikeCount(likeStatusRes.data?.data?.likeCount ?? 0);
          } catch (_) {}
        }

      } catch (err) {
        console.error('Failed to load video:', err);
        setError('Something went wrong while loading this video.');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchData();
  }, [videoId]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  const handleToggleLike = async () => {
    if (!currentUser) { alert('Please log in to like videos.'); return; }
    try {
      const res = await axios.post(`/api/v1/likes/toggle/v/${videoId}`, {}, { withCredentials: true });
      const { isLiked: nowLiked, likeCount: newCount } = res.data?.data || {};
      setIsLiked(!!nowLiked);
      if (typeof newCount === 'number') setLikeCount(newCount);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to like the video.');
    }
  };

  const handleToggleSubscribe = async () => {
    if (!currentUser) { alert('Please log in to subscribe.'); return; }
    if (!video?.owner?._id) return;
    if (currentUser._id?.toString() === video.owner._id?.toString()) {
      alert('You cannot subscribe to your own channel!');
      return;
    }
    try {
      const res = await axios.post(
        `/api/v1/subscriptions/c/${video.owner._id}`,
        {},
        { withCredentials: true }
      );
      const { isSubscribed: nowSubbed, subscriberCount: newCount } = res.data?.data || {};
      setIsSubscribed(!!nowSubbed);
      if (typeof newCount === 'number') setSubscriberCount(newCount);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to subscribe.');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser) { alert('Please log in to comment.'); return; }
    try {
      setIsPosting(true);
      const res = await axios.post(
        `/api/v1/comments/${videoId}`,
        { content: newComment },
        { withCredentials: true }
      );
      const posted = res.data?.data;
      setComments(prev => [{ ...posted, owner: currentUser }, ...prev]);
      setNewComment('');
      setShowCommentActions(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setIsPosting(false);
    }
  };

  // ==========================================
  // PLAYLIST HANDLERS
  // ==========================================

  const handleOpenPlaylistModal = async () => {
    if (!currentUser) { alert('Please log in to save videos to playlists.'); return; }
    setShowPlaylistModal(true);
    setShowCreateForm(false);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    try {
      const res = await axios.get(`/api/v1/playlists/user/${currentUser._id}`, { withCredentials: true });
      setPlaylists(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch playlists:', err.response?.data?.message || err.message);
    }
  };

  const handleToggleVideoInPlaylist = async (playlistId, currentlyIncludes) => {
    try {
      if (currentlyIncludes) {
        await axios.patch(`/api/v1/playlists/remove/${videoId}/${playlistId}`, {}, { withCredentials: true });
        setPlaylists(prev => prev.map(pl =>
          pl._id === playlistId
            ? { ...pl, videos: pl.videos.filter(v => v?.toString() !== videoId.toString()) }
            : pl
        ));
      } else {
        await axios.patch(`/api/v1/playlists/add/${videoId}/${playlistId}`, {}, { withCredentials: true });
        setPlaylists(prev => prev.map(pl =>
          pl._id === playlistId ? { ...pl, videos: [...pl.videos, videoId] } : pl
        ));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update playlist.');
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !newPlaylistDesc.trim()) return;
    try {
      setIsCreatingPlaylist(true);

      // Step 1: Create playlist
      const createRes = await axios.post(
        '/api/v1/playlists',
        { name: newPlaylistName, description: newPlaylistDesc },
        { withCredentials: true }
      );
      const newPl = createRes.data?.data;
      if (!newPl?._id) throw new Error('Playlist creation returned no ID.');

      // Step 2: Add this video to the new playlist
      await axios.patch(
        `/api/v1/playlists/add/${videoId}/${newPl._id}`,
        {},
        { withCredentials: true }
      );

      // Step 3: Update UI
      setPlaylists(prev => [{ ...newPl, videos: [videoId] }, ...prev]);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Create playlist error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to create playlist.');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  if (loading) return (
    <div className="w-full h-[70vh] flex justify-center items-center">
      <div className="w-10 h-10 border-4 border-[#C85C2C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !video) return (
    <div className="text-center mt-10 text-red-500 font-medium">{error || 'Video not found.'}</div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto pb-10 relative">

      {/* Video Player */}
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg mb-4">
        <video
          src={video.videoFile}
          poster={video.thumbnail}
          controls
          autoPlay
          className="w-full h-full object-contain outline-none"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 line-clamp-2 mb-2">{video.title}</h1>
      <div className="text-sm text-gray-500 font-medium mb-4">
        {viewCount.toLocaleString()} views &bull;{' '}
        {new Date(video.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
      </div>

      {/* Owner + Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">

        {/* Channel Info + Subscribe */}
        <div className="flex items-center gap-3">
          <Link
            to={`/user/${video.owner?.username}`}
            className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border border-gray-100 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <img
              src={video.owner?.avatar || defaultAvatar}
              alt={video.owner?.username}
              onError={e => { e.target.src = defaultAvatar; }}
              className="w-full h-full object-cover"
            />
          </Link>

          <div className="flex flex-col">
            <Link to={`/user/${video.owner?.username}`}>
              <h3 className="text-base font-bold text-gray-900 leading-tight hover:text-[#C85C2C] transition-colors">
                {video.owner?.fullName || video.owner?.username}
              </h3>
            </Link>
            <span className="text-xs text-gray-500">
              {subscriberCount > 0 ? `${subscriberCount.toLocaleString()} subscriber${subscriberCount !== 1 ? 's' : ''}` : `@${video.owner?.username}`}
            </span>
          </div>

          <button
            onClick={handleToggleSubscribe}
            className={`ml-1 px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              isSubscribed
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isSubscribed ? <><FaBell className="text-gray-500" /> Following</> : 'Follow'}
          </button>
        </div>

        {/* Like / Comment Count / Save */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Like Button with Count */}
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              isLiked
                ? 'bg-[#fff0eb] text-[#C85C2C] ring-1 ring-[#C85C2C]/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaThumbsUp className={isLiked ? 'text-[#C85C2C]' : ''} />
            <span>{isLiked ? 'Liked' : 'Like'}</span>
            {likeCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                isLiked ? 'bg-[#C85C2C]/20 text-[#C85C2C]' : 'bg-gray-200 text-gray-600'
              }`}>
                {likeCount.toLocaleString()}
              </span>
            )}
          </button>

          {/* Comment Count */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold text-sm">
            <FaCommentAlt />
            <span>{comments.length.toLocaleString()}</span>
            <span className="hidden sm:inline text-gray-500">Comments</span>
          </div>

          {/* Save to Playlist */}
          <button
            onClick={handleOpenPlaylistModal}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-semibold text-sm transition-colors"
          >
            <FaBookmark /> Save
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6 bg-gray-50 rounded-2xl p-4 text-sm text-gray-800 whitespace-pre-wrap border border-gray-100">
        <p className="font-bold mb-2">Description</p>
        {video.description || 'No description provided.'}
      </div>

      {/* Comments Section */}
      <div className="mt-10 max-w-4xl">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          {comments.length.toLocaleString()} Comment{comments.length !== 1 ? 's' : ''}
        </h3>

        {/* Comment Input */}
        <div className="flex gap-4 mb-10">
          <Link
            to={currentUser ? `/user/${currentUser.username}` : '#'}
            className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-100 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <img
              src={currentUser?.avatar || defaultAvatar}
              alt="You"
              onError={e => { e.target.src = defaultAvatar; }}
              className="w-full h-full object-cover"
            />
          </Link>
          <div className="flex-1 flex flex-col">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onFocus={() => setShowCommentActions(true)}
              onChange={e => setNewComment(e.target.value)}
              className="w-full border-b border-gray-300 focus:border-gray-900 bg-transparent px-2 py-2 outline-none transition-colors text-sm"
            />
            {showCommentActions && (
              <div className="flex justify-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => { setShowCommentActions(false); setNewComment(''); }}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePostComment}
                  disabled={!newComment.trim() || isPosting}
                  className="bg-[#C85C2C] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#b04f23] transition-colors disabled:opacity-50"
                >
                  {isPosting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comment List */}
        {comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment._id} className="flex gap-4">
                <Link
                  to={`/user/${comment.owner?.username}`}
                  className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-100 flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={comment.owner?.avatar || defaultAvatar}
                    alt={comment.owner?.username}
                    onError={e => { e.target.src = defaultAvatar; }}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                    <Link to={`/user/${comment.owner?.username}`} className="hover:text-[#C85C2C] transition-colors">
                      @{comment.owner?.username || 'user'}
                    </Link>
                    <span className="text-xs font-normal text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
                    </span>
                  </p>
                  <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm font-medium">No comments yet. Be the first to start the conversation!</p>
          </div>
        )}
      </div>

      {/* Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Save video to...</h3>
              <button
                onClick={() => { setShowPlaylistModal(false); setShowCreateForm(false); }}
                className="text-gray-500 hover:text-gray-900 p-1"
              >
                <FaTimes />
              </button>
            </div>

            {/* Playlist List */}
            <div className="p-4 max-h-60 overflow-y-auto">
              {playlists.length > 0 ? (
                <div className="space-y-3">
                  {playlists.map(playlist => {
                    const isAdded = playlist.videos.some(v => v?.toString() === videoId.toString());
                    return (
                      <label key={playlist._id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isAdded}
                          onChange={() => handleToggleVideoInPlaylist(playlist._id, isAdded)}
                          className="w-4 h-4 text-[#C85C2C] bg-gray-100 border-gray-300 rounded focus:ring-[#C85C2C] cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-800 group-hover:text-[#C85C2C] transition-colors truncate">
                          {playlist.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">You don't have any playlists yet.</p>
              )}
            </div>

            {/* Create New Playlist */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-[#C85C2C] transition-colors w-full justify-center"
                >
                  <FaPlus /> Create new playlist
                </button>
              ) : (
                <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Name</label>
                    <input
                      type="text"
                      required
                      value={newPlaylistName}
                      onChange={e => setNewPlaylistName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#C85C2C]"
                      placeholder="Enter playlist name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Description</label>
                    <input
                      type="text"
                      required
                      value={newPlaylistDesc}
                      onChange={e => setNewPlaylistDesc(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#C85C2C]"
                      placeholder="Brief description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-bold hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingPlaylist || !newPlaylistName.trim() || !newPlaylistDesc.trim()}
                      className="flex-1 bg-[#C85C2C] text-white rounded-lg py-2 text-sm font-bold hover:bg-[#b04f23] transition-colors disabled:opacity-50"
                    >
                      {isCreatingPlaylist ? 'Creating...' : 'Create & Save'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}