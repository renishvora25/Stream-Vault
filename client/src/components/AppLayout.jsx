import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

import axios from 'axios';
import {
  FaHome, FaUsers, FaList, FaHistory, FaCog, FaQuestionCircle,
  FaSignOutAlt, FaSearch, FaUpload, FaBell, FaUserCircle, FaTimes, FaVideo
} from 'react-icons/fa';
import UploadVideoModal from './Upload.jsx';

const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=f3f4f6&color=374151';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    axios.get('/api/v1/users/current-user', { withCredentials: true })
      .then(res => {
        const userData = res.data?.user || res.data?.data?.user || res.data?.data || null;
        setUser(userData);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await axios.get(`/api/v1/users/search?q=${encodeURIComponent(q.trim())}`, {
        withCredentials: true,
      });
      const users = res.data?.data || [];
      setSuggestions(users);
      setShowSuggestions(users.length > 0);
      setActiveIndex(-1);
    } catch (_) {
      setSuggestions([]);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceTimer.current);
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceTimer.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelectUser = (username) => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/user/${username}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      handleSelectUser(suggestions[activeIndex].username);
    } else if (suggestions.length > 0) {
      handleSelectUser(suggestions[0].username);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Escape') { setShowSuggestions(false); setActiveIndex(-1); }
    else if (e.key === 'Enter') { handleSearchSubmit(e); }
  };

  const handleSignOut = () => navigate('/login');

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">

      {isUploadModalOpen && (
        <UploadVideoModal onClose={() => setIsUploadModalOpen(false)} />
      )}

      <header className="bg-black text-white h-16 min-h-16 flex items-center justify-between px-6 z-30 shadow-md">
        <Link to="/" className="text-xl font-bold tracking-tight select-none cursor-pointer flex-shrink-0">
          Stream<span className="text-[#C85C2C]">Vault</span>
        </Link>

        <div ref={searchRef} className="flex-1 max-w-xl mx-6 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search users…"
              autoComplete="off"
              className="w-full h-9 bg-neutral-900 border border-neutral-800 rounded-full pl-9 pr-9 text-sm text-gray-200 placeholder-neutral-500 focus:outline-none focus:border-[#C85C2C] focus:ring-1 focus:ring-[#C85C2C] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              {suggestions.map((u, idx) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => handleSelectUser(u.username)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeIndex === idx ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={u.avatar || defaultAvatar}
                    alt={u.username}
                    onError={e => { e.target.src = defaultAvatar; }}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.fullname || u.username}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                  {activeIndex === idx && (
                    <span className="ml-auto text-[#C85C2C] text-xs font-bold shrink-0">View →</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-[#C85C2C] hover:bg-[#b04f23] text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-sm"
          >
            <FaUpload /> Upload
          </button>



          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-neutral-950 border border-neutral-800 overflow-hidden hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            title={user?.fullname || 'View Profile'}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <FaUserCircle className="w-full h-full text-neutral-400 bg-neutral-900" />
            )}
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-60 bg-white border-r border-gray-100 flex flex-col justify-between p-4 h-full">
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">Library</p>
              <nav className="space-y-1">
                {[
                  { to: '/', icon: <FaHome className="text-lg" />, label: 'Home', exact: true },
                  { to: '/subscriptions', icon: <FaUsers className="text-lg" />, label: 'Subscriptions', exact: false },
                  { to: '/playlists', icon: <FaList className="text-lg" />, label: 'Playlists', exact: false },
                  { to: '/history', icon: <FaHistory className="text-lg" />, label: 'History', exact: false },
                  { to: '/dashboard', icon: <FaVideo className="text-lg" />, label: 'Dashboard', exact: false },
                ].map(({ to, icon, label, exact }) => {
                  const isActive = exact
                    ? location.pathname === to
                    : location.pathname === to || location.pathname.startsWith(to + '/');
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'text-[#C85C2C] bg-orange-50/50'
                          : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className={isActive ? 'text-[#C85C2C]' : 'text-gray-400'}>{icon}</span>
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="space-y-1 border-t border-gray-100 pt-4">
            <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
              <FaCog className="text-lg" /> Settings
            </Link>
            <Link to="/help" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
              <FaQuestionCircle className="text-lg" /> Help
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50/50 transition-all text-left"
            >
              <FaSignOutAlt className="text-lg" /> Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}