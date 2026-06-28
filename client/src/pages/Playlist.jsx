import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaList, FaPlay, FaLock, FaFilm, FaPlus, FaTimes } from 'react-icons/fa';

const defaultCover = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=60';

function PlaylistCard({ playlist }) {
  return (
    <Link
      to={`/playlists/${playlist._id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
        {playlist.coverThumbnail ? (
          <img
            src={playlist.coverThumbnail}
            alt={playlist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.src = defaultCover; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
            <FaFilm className="text-4xl text-white/20" />
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/75 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
          <FaPlay className="text-[10px]" />
          {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <FaPlay className="text-white text-sm ml-0.5" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm truncate mb-1 group-hover:text-[#C85C2C] transition-colors">
          {playlist.name}
        </h3>
        <p className="text-xs text-gray-400 truncate">{playlist.description}</p>
        <p className="text-xs text-gray-300 mt-2">
          Updated {new Date(playlist.updatedAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
        </p>
      </div>
    </Link>
  );
}

export default function Playlists() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const userRes = await axios.get('/api/v1/users/current-user', { withCredentials: true });
        const currentUser =
          userRes.data?.user ||
          userRes.data?.data?.user ||
          userRes.data?.data ||
          null;

        if (!currentUser?._id) {
          navigate('/login');
          return;
        }

        const res = await axios.get(`/api/v1/playlists/user/${currentUser._id}`, {
          withCredentials: true,
        });
        setPlaylists(res.data?.data || []);
      } catch (err) {
        console.error(err);
        setError('Could not load your playlists.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !newPlaylistDesc.trim()) return;
    
    try {
      setIsCreating(true);
      const res = await axios.post(
        '/api/v1/playlists',
        { name: newPlaylistName, description: newPlaylistDesc },
        { withCredentials: true }
      );
      
      const newPlaylist = res.data?.data;
      if (newPlaylist) {
        setPlaylists(prev => [{ ...newPlaylist, videoCount: 0 }, ...prev]);
      }
      
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-[#C85C2C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="text-center py-12 text-red-500 text-sm">{error}</div>
  );

  return (
    <div className="w-full pb-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FaList className="text-[#C85C2C]" /> Playlists
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
          </p>
        </div>
        {playlists.length > 0 && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[#C85C2C] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-[#b04f23] transition-colors flex items-center gap-2 w-max shadow-sm"
          >
            <FaPlus /> Create Playlist
          </button>
        )}
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <FaList className="text-5xl text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No playlists yet</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Create your first playlist to organize your favorite videos.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#C85C2C] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#b04f23] transition-colors shadow-sm"
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map(pl => (
            <PlaylistCard key={pl._id} playlist={pl} />
          ))}
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Create New Playlist</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-900 p-1">
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleCreatePlaylist} className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Name</label>
                <input 
                  type="text" 
                  value={newPlaylistName} 
                  onChange={e => setNewPlaylistName(e.target.value)} 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C85C2C]" 
                  placeholder="e.g., Favorite Music" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Description</label>
                <textarea 
                  value={newPlaylistDesc} 
                  onChange={e => setNewPlaylistDesc(e.target.value)} 
                  rows="2" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C85C2C]" 
                  placeholder="Brief description of this playlist" 
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating} 
                  className="px-5 py-2 text-sm font-bold bg-[#C85C2C] text-white rounded-full hover:bg-[#b04f23] transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
