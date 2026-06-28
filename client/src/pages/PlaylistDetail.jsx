import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPlay, FaArrowLeft, FaTrash, FaClock, FaList } from 'react-icons/fa';
import VideoCard from '../components/VideoCard.jsx';

const defaultThumb = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=60';

export default function PlaylistDetail() {
  const { playlistId } = useParams();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [userRes, playlistRes] = await Promise.allSettled([
          axios.get('/api/v1/users/current-user', { withCredentials: true }),
          axios.get(`/api/v1/playlists/${playlistId}`, { withCredentials: true }),
        ]);

        if (userRes.status === 'fulfilled') {
          const u = userRes.value.data;
          setCurrentUser(u?.user || u?.data?.user || u?.data || null);
        }

        if (playlistRes.status === 'fulfilled') {
          setPlaylist(playlistRes.value.data?.data);
        } else {
          setError('Playlist not found.');
        }
      } catch (err) {
        setError('Failed to load playlist.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playlistId]);

  const isOwner = currentUser && playlist?.owner &&
    currentUser._id?.toString() === playlist.owner._id?.toString();

  const handleDeletePlaylist = async () => {
    if (!window.confirm(`Delete "${playlist.name}"? This cannot be undone.`)) return;
    try {
      setDeletingPlaylist(true);
      await axios.delete(`/api/v1/playlists/${playlistId}`, { withCredentials: true });
      navigate('/playlists');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete playlist.');
      setDeletingPlaylist(false);
    }
  };
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-[#C85C2C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !playlist) return (
    <div className="text-center py-16">
      <p className="text-red-500 font-medium mb-4">{error || 'Playlist not found.'}</p>
      <Link to="/playlists" className="text-[#C85C2C] font-semibold hover:underline text-sm">
        ← Back to Playlists
      </Link>
    </div>
  );

  const videos = playlist.videos?.filter(Boolean) || [];
  const coverThumb = videos[0]?.thumbnail;

  return (
    <div className="w-full pb-10">
      <Link
        to="/playlists"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium mb-6 transition-colors"
      >
        <FaArrowLeft className="text-xs" /> Back to Playlists
      </Link>
      <div className="flex flex-col sm:flex-row gap-6 mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="w-full sm:w-64 aspect-video sm:aspect-auto flex-shrink-0 bg-gray-100">
          {coverThumb ? (
            <img
              src={coverThumb}
              alt={playlist.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = defaultThumb; }}
            />
          ) : (
            <div className="w-full h-full min-h-40 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
              <FaList className="text-5xl text-white/20" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between p-5 sm:p-6 flex-1 min-w-0">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{playlist.name}</h1>
            <p className="text-sm text-gray-500 mb-4">{playlist.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <FaPlay className="text-[#C85C2C] text-xs" />
                {videos.length} video{videos.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <FaClock className="text-xs" />
                Updated {new Date(playlist.updatedAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5 flex-wrap">
            {videos.length > 0 && (
              <Link
                to={`/watch/${videos[0]._id}`}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                <FaPlay className="text-xs" /> Play All
              </Link>
            )}
            {isOwner && (
              <button
                onClick={handleDeletePlaylist}
                disabled={deletingPlaylist}
                className="flex items-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <FaTrash className="text-xs" />
                {deletingPlaylist ? 'Deleting…' : 'Delete Playlist'}
              </button>
            )}
          </div>
        </div>
      </div>
      {videos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <FaPlay className="text-4xl text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">This playlist is empty.</p>
          <Link to="/" className="text-[#C85C2C] text-sm font-semibold hover:underline mt-2 inline-block">
            Browse videos to add
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-base font-bold text-gray-900 mb-5 tracking-tight uppercase border-b-2 border-[#C85C2C] w-max pb-1.5">
            Videos in this Playlist
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
            {videos.map(video => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
