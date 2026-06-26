import React from 'react';
import { Link } from 'react-router-dom';

const formatDuration = (time) => {
  if (!time) return "00:00";
  
  if (typeof time === 'string' && time.includes(':')) return time;

  const seconds = Math.floor(Number(time));
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const formatPublishedDate = (dateString) => {
  if (!dateString) return "Unknown date";
  
  if (!dateString.includes('T') && !dateString.includes('-')) return dateString;

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  let relativeTime = "";
  if (diffInSeconds < 60) relativeTime = "Just now";
  else if (diffInSeconds < 3600) relativeTime = `${Math.floor(diffInSeconds / 60)} mins ago`;
  else if (diffInSeconds < 86400) relativeTime = `${Math.floor(diffInSeconds / 3600)} hours ago`;
  else if (diffInSeconds < 2592000) relativeTime = `${Math.floor(diffInSeconds / 86400)} days ago`;
  else if (diffInSeconds < 31536000) relativeTime = `${Math.floor(diffInSeconds / 2592000)} months ago`;
  else relativeTime = `${Math.floor(diffInSeconds / 31536000)} years ago`;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
  const year = date.getFullYear();
  
  const absoluteDate = `${day}-${month}-${year}`;

  return `${relativeTime} • ${absoluteDate}`;
};

export default function VideoCard({ video }) {
  if (!video) return null;

  return (
    <Link 
      to={`/watch/${video._id}`} 
      className="group flex flex-col cursor-pointer bg-white rounded-2xl p-3 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1 block"
    >
      
      {/* Thumbnail Box */}
      <div className="relative aspect-video w-full rounded-xl bg-neutral-200 overflow-hidden mb-3">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-[2px] text-[11px] font-bold text-white px-1.5 py-0.5 rounded-md tracking-wider">
          {formatDuration(video.duration)}
        </span>
      </div>

      {/* Video Meta Row */}
      <div className="flex gap-3 px-1">
        <div className="w-9 h-9 rounded-full bg-neutral-200 border border-gray-100 overflow-hidden flex-shrink-0">
          <img 
            src={video.owner?.avatar || 'https://via.placeholder.com/150'} 
            alt={video.owner?.username || 'Creator'} 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug transition-colors duration-300 group-hover:text-[#C85C2C] mb-1">
            {video.title}
          </h3>
          <p className="text-xs text-gray-500 font-medium truncate mb-0.5">
            @{video.owner?.username || 'unknown'}
          </p>
          <p className="text-[11px] font-medium text-gray-400">
            {video.views || "0 views"} &bull; {formatPublishedDate(video.createdAt)}
          </p>
        </div>
      </div>

    </Link>
  );
}