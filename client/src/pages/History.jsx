import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaHistory, FaPlay } from 'react-icons/fa';
import VideoCard from '../components/VideoCard.jsx';

export default function History() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('/api/v1/users/history', {
          withCredentials: true
        });
        setVideos(response.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setError("Could not load your watch history. Please make sure you are logged in.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#C85C2C] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 text-sm font-medium">Fetching history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center mt-10">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl font-medium border border-red-100 shadow-sm text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#C85C2C]">
          <FaHistory className="text-lg" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Watch History</h1>
          <p className="text-xs text-gray-500">Videos you have watched recently</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="w-full h-[50vh] flex flex-col justify-center items-center bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <FaPlay className="text-xl text-gray-300 ml-1" />
          </div>
          <p className="text-gray-900 font-bold text-lg mb-2">No watch history yet</p>
          <p className="text-gray-500 text-sm mb-5">Start watching videos to see them listed here.</p>
          <Link to="/" className="bg-[#C85C2C] hover:bg-[#b04f23] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm">
            Explore Videos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
