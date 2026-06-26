import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserCircle, FaBell, FaThumbsUp, FaVideo } from 'react-icons/fa';
import VideoCard from '../components/VideoCard.jsx';

const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=f3f4f6&color=374151';

export default function UserProfile() {
  const { username } = useParams();          // present when visiting /user/:username
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);  // the channel being viewed
  const [currentUser, setCurrentUser] = useState(null);  // logged-in viewer
  const [videos, setVideos] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Get logged-in user (if any)
        let loggedInUser = null;
        try {
          const meRes = await axios.get('/api/v1/users/current-user', { withCredentials: true });
          loggedInUser =
            meRes.data?.user ||
            meRes.data?.data?.user ||
            meRes.data?.data ||
            null;
          if (!loggedInUser?._id) loggedInUser = null;
          setCurrentUser(loggedInUser);
        } catch (_) { /* guest */ }

        // 2. Determine which username to load
        //    - /user/:username  → use the param
        //    - /profile         → use logged-in user's username
        let targetUsername = username;
        if (!targetUsername) {
          if (!loggedInUser) {
            navigate('/login');
            return;
          }
          targetUsername = loggedInUser.username;
        }

        // 3. Fetch channel profile via existing endpoint
        //    GET /api/v1/users/c/:username  — returns { data: { fullName, username, avatar, coverImage, subscribersCount, isSubscribed } }
        const channelRes = await axios.get(`/api/v1/users/c/${targetUsername}`, { withCredentials: true });
        const channelData = channelRes.data?.data;
        if (!channelData) { setError('User not found.'); return; }

        setProfileUser(channelData);
        setSubscriberCount(channelData.subscribersCount || 0);
        setIsSubscribed(!!channelData.isSubscribed);
        setIsOwnProfile(loggedInUser?.username?.toLowerCase() === targetUsername.toLowerCase());

        // 4. Fetch this user's videos
        try {
          const videosRes = await axios.get(`/api/v1/videos?userId=${channelData._id}`, { withCredentials: true });
          const raw = videosRes.data?.data;
          setVideos(Array.isArray(raw) ? raw : (raw?.docs || []));
        } catch (_) { setVideos([]); }

      } catch (err) {
        console.error('Profile load error:', err);
        setError(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  const handleToggleSubscribe = async () => {
    if (!currentUser) { navigate('/login'); return; }
    if (isOwnProfile) return;
    try {
      const res = await axios.post(
        `/api/v1/subscriptions/c/${profileUser._id}`,
        {},
        { withCredentials: true }
      );
      const { isSubscribed: nowSubbed, subscriberCount: newCount } = res.data?.data || {};
      setIsSubscribed(!!nowSubbed);
      if (typeof newCount === 'number') setSubscriberCount(newCount);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subscription.');
    }
  };

  // ——— Loading ———
  if (loading) return (
    <div className="w-full h-[60vh] flex justify-center items-center">
      <div className="w-10 h-10 border-4 border-[#C85C2C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ——— Error ———
  if (error || !profileUser) return (
    <div className="text-center py-16 max-w-md mx-auto mt-10">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaUserCircle className="w-10 h-10 text-red-300" />
      </div>
      <p className="font-bold text-gray-900 mb-1">Profile not found</p>
      <p className="text-sm text-red-500 mb-6">{error}</p>
      <Link to="/" className="bg-[#C85C2C] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#b04f23] transition-colors text-sm">
        Go Home
      </Link>
    </div>
  );

  return (
    <div className="w-full -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 pb-10">

      {/* ——— Cover Image ——— */}
      <div className="w-full h-44 sm:h-56 overflow-hidden relative bg-neutral-900">
        {profileUser.coverImage ? (
          <img
            src={profileUser.coverImage}
            alt="Channel banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
            <span className="text-white/10 font-black tracking-[0.3em] text-xs uppercase select-none">
              Stream Vault
            </span>
          </div>
        )}
      </div>

      {/* ——— Avatar + Info ——— */}
      <div className="px-4 sm:px-8 flex flex-col sm:flex-row items-center sm:items-end gap-4 relative z-10 -mt-14 sm:-mt-16 mb-6">

        {/* Avatar */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-1 shadow-xl border-4 border-white overflow-hidden flex-shrink-0">
          {profileUser.avatar ? (
            <img
              src={profileUser.avatar}
              alt={profileUser.fullName}
              className="w-full h-full object-cover rounded-full"
              onError={e => { e.target.src = defaultAvatar; }}
            />
          ) : (
            <FaUserCircle className="w-full h-full text-gray-300" />
          )}
        </div>

        {/* Name + Stats + Subscribe */}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
              {profileUser.fullName || profileUser.username}
            </h1>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500 font-medium">
              <span className="text-[#C85C2C] font-bold">@{profileUser.username}</span>
              <span className="text-gray-300">&bull;</span>
              <span className="flex items-center gap-1">
                <FaBell className="text-gray-400 text-xs" />
                {subscriberCount.toLocaleString()} subscriber{subscriberCount !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-300">&bull;</span>
              <span className="flex items-center gap-1">
                <FaVideo className="text-gray-400 text-xs" />
                {videos.length} video{videos.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Subscribe / Edit Profile button */}
          {!isOwnProfile ? (
            <button
              onClick={handleToggleSubscribe}
              className={`flex-shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
                isSubscribed
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isSubscribed ? <><FaBell className="text-[#C85C2C]" /> Following</> : <><FaBell /> Follow</>}
            </button>
          ) : (
            <Link
              to="/settings"
              className="flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200"
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      <hr className="border-gray-200 mb-8 mx-4 sm:mx-8" />

      {/* ——— Videos ——— */}
      <div className="px-4 sm:px-8">
        <h3 className="text-base font-bold text-gray-900 mb-5 tracking-tight uppercase border-b-2 border-[#C85C2C] w-max pb-1.5">
          Videos
        </h3>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
            {videos.map(video => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <FaVideo className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">No videos uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}