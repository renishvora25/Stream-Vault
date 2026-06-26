import React, { useState } from 'react';
import axios from 'axios';
import { FaTimes, FaCloudUploadAlt, FaImage } from 'react-icons/fa';

export default function UploadVideoModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!videoFile || !thumbnailFile) {
      setError('Both video and thumbnail files are required.');
      setLoading(false);
      return;
    }

    // Because we are sending files, we MUST use FormData
    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('videoFile', videoFile);
    uploadData.append('thumbnail', thumbnailFile);

    try {
      // Make sure this matches your backend upload route!
      const response = await axios.post('/api/v1/videos', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          onClose(); // Close modal after 2 seconds
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload video.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Upload Video</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-green-600">
              <FaCloudUploadAlt className="text-6xl mb-4" />
              <h3 className="text-2xl font-bold mb-2">Upload Successful!</h3>
              <p className="text-sm text-gray-500">Your video is now being processed.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-100">{error}</div>}

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Title (required)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Add a title that describes your video"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C85C2C]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
                <textarea 
                  rows="4"
                  placeholder="Tell viewers about your video"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C85C2C] resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Video File Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Video File *</label>
                  <div className="relative w-full h-[45px] flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 hover:border-[#C85C2C] transition-colors">
                    <input 
                      type="file" 
                      accept="video/*" 
                      required
                      onChange={(e) => setVideoFile(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-[#fff0eb] file:text-[#C85C2C] file:font-semibold cursor-pointer" 
                    />
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Thumbnail *</label>
                  <div className="relative w-full h-[45px] flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 hover:border-[#C85C2C] transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      required
                      onChange={(e) => setThumbnailFile(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-[#fff0eb] file:text-[#C85C2C] file:font-semibold cursor-pointer" 
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#C85C2C] hover:bg-[#b04f23] text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>Uploading... <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-2"></span></>
                  ) : (
                    <>Publish Video</>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}