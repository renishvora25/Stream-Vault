import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUsers, FaEye, FaHeart, FaVideo, FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0
  });
  const [videos, setVideos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Video State
  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThumbnail, setEditThumbnail] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [statsRes, videosRes] = await Promise.all([
          axios.get('/api/v1/dashboard/stats', { withCredentials: true }),
          axios.get('/api/v1/dashboard/videos', { withCredentials: true })
        ]);

        setStats(statsRes.data?.data || {});
        setVideos(videosRes.data?.data || []);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Could not load your dashboard. Please make sure you are logged in.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleOpenEdit = (video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description);
    setEditThumbnail(null);
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      if (editThumbnail) {
        formData.append('thumbnail', editThumbnail);
      }

      const res = await axios.patch(`/api/v1/videos/${editingVideo._id}`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updated = res.data?.data;
      setVideos(prev => prev.map(v => v._id === updated._id ? updated : v));
      setEditingVideo(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update video');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video? This action cannot be undone.")) return;
    
    try {
      await axios.delete(`/api/v1/videos/${videoId}`, { withCredentials: true });
      setVideos(prev => prev.filter(v => v._id !== videoId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete video');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num || 0;
  };

  if (loading) {
    return (
      <div className="w-full h-[70vh] flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#C85C2C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500 font-medium">{error}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Creator Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium">Welcome back! Here is how your channel is doing.</p>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl shrink-0">
            <FaEye />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Total Views</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalViews)}</h3>
          </div>
        </div>

        
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-[#C85C2C] flex items-center justify-center text-xl shrink-0">
            <FaUsers />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Subscribers</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalSubscribers)}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center text-xl shrink-0">
            <FaHeart />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Total Likes</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalLikes)}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-xl shrink-0">
            <FaVideo />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Uploaded Videos</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalVideos)}</h3>
          </div>
        </div>

      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">Your Content</h2>
      
      {videos.length > 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4 pl-6">Video</th>
                  <th className="p-4">Visibility</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Views</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {videos.map((video) => (
                  <tr key={video._id} className="hover:bg-gray-50/50 transition-colors group">
                    
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-gray-200 shrink-0">
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="max-w-[250px]">
                          <Link to={`/watch/${video._id}`} className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-[#C85C2C] transition-colors">
                            {video.title}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{video.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        video.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {video.isPublished ? 'Public' : 'Draft'}
                      </span>
                    </td>

                    <td className="p-4 text-sm font-medium text-gray-600">
                      {new Date(video.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
                    </td>

                    <td className="p-4 text-sm font-medium text-gray-600">
                      {formatNumber(video.views)}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(video)}
                          className="p-2 text-gray-400 hover:text-blue-500 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" 
                          title="Edit Video"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteVideo(video._id)}
                          className="p-2 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" 
                          title="Delete Video"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaVideo className="text-3xl text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No videos yet</h3>
          <p className="text-gray-500 mb-6">Upload your first video to start building your audience!</p>

        </div>
      )}

      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Video</h3>
              <button onClick={() => setEditingVideo(null)} className="text-gray-500 hover:text-gray-900 p-1">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateVideo} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Title</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C85C2C]" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Description</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows="3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C85C2C]" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Thumbnail</label>
                <input type="file" accept="image/*" onChange={e => setEditThumbnail(e.target.files[0])} className="text-xs w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#C85C2C] hover:file:bg-orange-100" />
                <p className="text-[10px] text-gray-400 mt-1">Leave empty to keep the current thumbnail.</p>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setEditingVideo(null)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating} className="px-5 py-2 text-sm font-bold bg-[#C85C2C] text-white rounded-full hover:bg-[#b04f23] transition-colors disabled:opacity-50">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}