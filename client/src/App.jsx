import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx'; 
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx'; 
import Subscriptions from './pages/Subscriptions.jsx';
import Watch from './pages/Watch.jsx';
import Playlists from './pages/Playlist.jsx';
import PlaylistDetail from './pages/PlaylistDetail.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import Help from './pages/Help.jsx';

const Placeholder = ({ title }) => (
  <div className="w-full">
    <h1 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">{title}</h1>
    <p className="text-sm text-gray-400 font-medium">{title} section coming soon...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Main App Routes wrapped in the Layout */}
        <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/watch/:videoId" element={<Watch />} /> 
            <Route path="/profile" element={<Profile />} /> 
            {/* /user/:username — view ANY user's public profile */}
            <Route path="/user/:username" element={<Profile />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlists/:playlistId" element={<PlaylistDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;