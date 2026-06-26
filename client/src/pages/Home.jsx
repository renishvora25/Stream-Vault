import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoCard from '../components/VideoCard.jsx';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get('/api/v1/videos', {
          withCredentials: true
        });
        
        const fetchedVideos = response.data?.data?.docs || response.data?.data || [];
        setVideos(fetchedVideos);
        
      } catch (err) {
        console.error("Failed to fetch home feed:", err);
        setError("Could not load the video feed right now. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#C85C2C] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 text-sm font-medium">Loading archives...</p>
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

  if (videos.length === 0) {
    return (
      <div className="w-full h-[50vh] flex flex-col justify-center items-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-900 font-bold text-lg mb-2">The vault is currently empty.</p>
        <p className="text-gray-500 text-sm">Be the first to upload a video!</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
        {videos.map((video) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
}