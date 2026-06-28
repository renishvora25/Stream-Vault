import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaUserEdit, FaCamera, FaKey, FaVideo, FaSpinner } from 'react-icons/fa';

export default function Settings() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confPassword, setConfPassword] = useState('');

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [updatingCover, setUpdatingCover] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/v1/users/current-user', { withCredentials: true });
        const user = res.data?.user || res.data?.data?.user || res.data?.data;
        if (!user) {
          navigate('/login');
          return;
        }
        setCurrentUser(user);
        setFullName(user.fullName || '');
        setEmail(user.email || '');
      } catch (err) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName || !email) return showMessage('error', 'Full Name and Email are required');
    try {
      setUpdatingProfile(true);
      await axios.patch('/api/v1/users/update-account', { fullName, email }, { withCredentials: true });
      showMessage('success', 'Profile details updated successfully');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    if (!avatarFile) return showMessage('error', 'Please select an avatar image');
    try {
      setUpdatingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await axios.patch('/api/v1/users/avatar', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentUser(res.data?.user || res.data?.data);
      setAvatarFile(null);
      showMessage('success', 'Avatar updated successfully');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update avatar');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleUpdateCover = async (e) => {
    e.preventDefault();
    if (!coverImageFile) return showMessage('error', 'Please select a cover image');
    try {
      setUpdatingCover(true);
      const formData = new FormData();
      formData.append('coverImage', coverImageFile);
      const res = await axios.patch('/api/v1/users/cover-image', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentUser(res.data?.user || res.data?.data);
      setCoverImageFile(null);
      showMessage('success', 'Cover image updated successfully');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update cover image');
    } finally {
      setUpdatingCover(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confPassword) {
      return showMessage('error', 'New password and confirm password must match');
    }
    try {
      setUpdatingPassword(true);
      await axios.post('/api/v1/users/change-password', {
        oldPassword, newPassword, confPassword
      }, { withCredentials: true });
      setOldPassword('');
      setNewPassword('');
      setConfPassword('');
      showMessage('success', 'Password changed successfully');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-3xl text-[#C85C2C]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 font-medium">Manage your account, profile, and videos.</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
          <p className="font-semibold text-sm">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Manage Videos & Images */}
        <div className="lg:col-span-1 space-y-6">
          {/* Manage Videos Link */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-orange-50 text-[#C85C2C] rounded-full flex items-center justify-center mb-4">
              <FaVideo className="text-2xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Creator Dashboard</h2>
            <p className="text-sm text-gray-500 mb-6">Manage all your uploaded videos, views, and analytics.</p>
            <Link to="/dashboard" className="w-full py-2.5 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors">
              Manage Videos
            </Link>
          </div>

          {/* Update Avatar */}
          <form onSubmit={handleUpdateAvatar} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">Profile Picture</h2>
            <div className="flex items-center gap-4 mb-4">
              <img src={currentUser?.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
              <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} className="text-xs w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#C85C2C] hover:file:bg-orange-100" />
            </div>
            <button type="submit" disabled={!avatarFile || updatingAvatar} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors">
              {updatingAvatar ? 'Uploading...' : 'Update Avatar'}
            </button>
          </form>

          {/* Update Cover Image */}
          <form onSubmit={handleUpdateCover} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">Cover Image</h2>
            <div className="mb-4">
              {currentUser?.coverImage && <img src={currentUser.coverImage} alt="Cover" className="w-full h-24 object-cover rounded-lg border border-gray-200 mb-3" />}
              <input type="file" accept="image/*" onChange={e => setCoverImageFile(e.target.files[0])} className="text-xs w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#C85C2C] hover:file:bg-orange-100" />
            </div>
            <button type="submit" disabled={!coverImageFile || updatingCover} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors">
              {updatingCover ? 'Uploading...' : 'Update Cover Image'}
            </button>
          </form>
        </div>

        {/* Right Column: Profile Details & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Update Profile Details */}
          <form onSubmit={handleUpdateProfile} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <FaUserEdit className="text-[#C85C2C] text-xl" />
              <h2 className="text-xl font-bold text-gray-900">Update Profile Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <input type="text" value={currentUser?.username || ''} disabled className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 focus:outline-none" />
                <p className="text-xs text-gray-400 mt-1">Username cannot be changed.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors" placeholder="you@example.com" />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button type="submit" disabled={updatingProfile} className="px-8 py-2.5 bg-[#C85C2C] text-white rounded-full font-bold text-sm hover:bg-[#b04f23] transition-colors disabled:opacity-50">
                {updatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <FaKey className="text-gray-900 text-lg" />
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" value={confPassword} onChange={e => setConfPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-colors" />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button type="submit" disabled={updatingPassword} className="px-8 py-2.5 bg-black text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
