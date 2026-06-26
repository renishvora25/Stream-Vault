import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUsers, FaEye, FaHeart, FaVideo, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch Stats & Videos at the same time for speed
        // Note: Make sure these routes match your backend route file! (e.g., dashboard.routes.js)
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

  // Helper function to format big numbers (e.g., 1500 -> 1.5K)
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
      
      {/* 1. DASHBOARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Creator Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium">Welcome back! Here is how your channel is doing.</p>
        </div>
        {/* If you built the Upload Modal earlier, you can hook this button up to it! */}
        <button className="bg-[#C85C2C] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-[#b04f23] transition-colors flex items-center gap-2 w-max">
          <FaPlus /> Upload Video
        </button>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Total Views */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl shrink-0">
            <FaEye />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Total Views</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalViews)}</h3>
          </div>
        </div>

        {/* Total Subscribers */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-[#C85C2C] flex items-center justify-center text-xl shrink-0">
            <FaUsers />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Subscribers</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalSubscribers)}</h3>
          </div>
        </div>

        {/* Total Likes */}
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center text-xl shrink-0">
            <FaHeart />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Total Likes</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalLikes)}</h3>
          </div>
        </div>

        {/* Total Videos */}
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

      {/* 3. CONTENT MANAGER (Video List) */}
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
                    
                    {/* Video Info (Thumbnail + Title) */}
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

                    {/* Visibility */}
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        video.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {video.isPublished ? 'Public' : 'Draft'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-sm font-medium text-gray-600">
                      {new Date(video.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
                    </td>

                    {/* Views */}
                    <td className="p-4 text-sm font-medium text-gray-600">
                      {formatNumber(video.views)}
                    </td>

                    {/* Actions (Edit / Delete Placeholder) */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-blue-500 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Edit Video">
                          <FaEdit />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete Video">
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
          <button className="bg-[#C85C2C] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#b04f23] transition-colors">
            Upload Video
          </button>
        </div>
      )}

    </div>
  );
}