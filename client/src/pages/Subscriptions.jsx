import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaPlay, FaUsers } from 'react-icons/fa';
import VideoCard from '../components/VideoCard.jsx';

const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=f3f4f6&color=374151';

export default function Subscriptions() {
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [subscriptionVideos, setSubscriptionVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        // Get logged-in user
        const userRes = await axios.get('/api/v1/users/current-user', { withCredentials: true });
        const currentUser =
          userRes.data?.user ||
          userRes.data?.data?.user ||
          userRes.data?.data ||
          null;

        if (!currentUser?._id) {
          setError('Please log in to view your subscriptions.');
          return;
        }

        // Fetch channels + videos in parallel
        const [channelsRes, videosRes] = await Promise.allSettled([
          axios.get(`/api/v1/subscriptions/c/${currentUser._id}`, { withCredentials: true }),
          axios.get('/api/v1/videos/subscriptions', { withCredentials: true }),
        ]);

        // ── Channels ──────────────────────────────────────────────────────
        if (channelsRes.status === 'fulfilled') {
          const raw = channelsRes.value.data?.data || [];
          setSubscribedChannels(raw.map(item => item.channel).filter(Boolean));
        }

        // ── Videos ────────────────────────────────────────────────────────
        // getSubscribedVideos returns a plain array in data.data
        if (videosRes.status === 'fulfilled') {
          const payload = videosRes.value.data?.data;

          // Normalize: could be a plain array OR a paginated { docs: [...] } object
          let videos = [];
          if (Array.isArray(payload)) {
            videos = payload;
          } else if (payload?.docs && Array.isArray(payload.docs)) {
            videos = payload.docs;
          } else if (payload) {
            videos = Object.values(payload).filter(v => typeof v === 'object');
          }

          // Sort by most recent upload first
          videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setSubscriptionVideos(videos);
        } else {
          console.warn('Subscription videos failed:', videosRes.reason?.message);
        }

      } catch (err) {
        console.error(err);
        setError('Could not load your subscriptions right now.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-[#C85C2C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="text-center py-12 text-red-500 font-medium bg-red-50/50 rounded-xl max-w-xl mx-auto mt-10 p-6 border border-red-100">
      <p className="font-bold mb-1">Error</p>
      <p className="text-sm text-red-600">{error}</p>
    </div>
  );

  // ─── Empty: not following anyone ──────────────────────────────────────────
  if (subscribedChannels.length === 0) return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <FaUsers className="text-6xl text-gray-200 mb-5" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">No subscriptions yet</h2>
      <p className="text-gray-400 text-sm mb-6 max-w-xs">
        Follow channels to see their latest uploads here. Use the search bar above to find creators.
      </p>
      <Link to="/" className="bg-[#C85C2C] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#b04f23] transition-colors">
        Explore Channels
      </Link>
    </div>
  );

  return (
    <div className="w-full pb-10">

      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Subscriptions</h1>
        <p className="text-sm text-gray-400 mt-0.5">Videos from channels you follow · sorted by latest</p>
      </div>

      {/* ─── Subscribed Channels Strip ────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <FaUsers className="text-gray-400" />
          Your Creators
        </h2>
        <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs font-bold">
          {subscribedChannels.length}
        </span>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide select-none border-b border-gray-200 mb-8">
        {subscribedChannels.map(channel => (
          <Link
            key={channel._id}
            to={`/user/${channel.username}`}
            className="flex flex-col items-center gap-2 group min-w-max"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#C85C2C] transition-all duration-200">
                <img
                  src={channel.avatar || defaultAvatar}
                  alt={channel.username}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = defaultAvatar; }}
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <span className="text-[11px] font-semibold text-gray-600 truncate w-14 text-center group-hover:text-[#C85C2C] transition-colors">
              {channel.username}
            </span>
          </Link>
        ))}
      </div>

      {/* ─── Latest Videos ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <h3 className="text-base font-bold text-gray-900 uppercase tracking-tight border-b-2 border-[#C85C2C] pb-1.5 flex items-center gap-2">
          <FaPlay className="text-[#C85C2C] text-xs" />
          Latest Uploads
        </h3>
        {subscriptionVideos.length > 0 && (
          <span className="text-xs text-gray-400 font-medium">
            {subscriptionVideos.length} video{subscriptionVideos.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {subscriptionVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {subscriptionVideos.map(video => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <FaPlay className="text-4xl text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Your creators haven't uploaded anything recently.</p>
        </div>
      )}
    </div>
  );
}