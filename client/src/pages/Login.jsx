import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaImage, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // LOGIN 
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/v1/users/login', {
        email: loginData.identifier.includes('@') ? loginData.identifier : undefined,
        username: !loginData.identifier.includes('@') ? loginData.identifier : undefined,
        password: loginData.password,
      }, {
        withCredentials: true 
      });

      if (response.status === 200) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // REGISTRATION
  const [regData, setRegData] = useState({ fullname: '', username: '', email: '', password: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!avatarFile) {
      setError("Avatar image is required!");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('fullname', regData.fullname);
    formData.append('username', regData.username);
    formData.append('email', regData.email);
    formData.append('password', regData.password);
    formData.append('avatar', avatarFile);
    if (coverFile) {
      formData.append('coverImage', coverFile);
    }

    try {
      const response = await axios.post('/api/v1/users/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      if (response.data.success) {
        setIsSignUp(false);
        setError('');
        setRegData({ fullname: '', username: '', email: '', password: '' });
        setAvatarFile(null);
        setCoverFile(null);
        alert("Registration successful! Please login.");
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || 'Registration failed. Try a different username/email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans selection:bg-[#C85C2C] selection:text-white">
      <div className="relative w-[850px] h-[600px] overflow-hidden rounded-[30px] bg-white shadow-[0_0_30px_rgba(0,0,0,0.15)]">
        
        {/* SIGN IN FORM*/}
        <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-10 transition-all duration-700 ease-in-out z-10 
          ${isSignUp ? 'translate-x-[20%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
          <div className="w-full max-w-[320px] mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Login</h2>
            
            {!isSignUp && error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}

            <form className="w-full space-y-5" onSubmit={handleLoginSubmit}>
              <div className="relative w-full h-[50px]">
                <input 
                  type="text" 
                  placeholder="Email or Username" 
                  value={loginData.identifier}
                  onChange={(e) => setLoginData({...loginData, identifier: e.target.value})}
                  className="w-full h-full bg-gray-100 border-none outline-none rounded-lg px-[20px] text-sm text-gray-800 font-medium focus:ring-2 focus:ring-[#C85C2C] transition-all" 
                  required 
                />
                <FaUser className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              </div>
              
              <div className="relative w-full h-[50px]">
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full h-full bg-gray-100 border-none outline-none rounded-lg pl-[20px] pr-[45px] text-sm text-gray-800 font-medium focus:ring-2 focus:ring-[#C85C2C] transition-all" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showLoginPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                </button>
              </div>

              <button disabled={loading} type="submit" className="w-full h-[48px] bg-[#C85C2C] text-white text-base font-semibold rounded-lg hover:bg-[#a64b23] transition-colors duration-300 mt-2 disabled:opacity-70">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>

        {/* SIGN UP FORM*/}

        <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-8 transition-all duration-700 ease-in-out z-10 
          ${isSignUp ? 'translate-x-[100%] opacity-100' : 'translate-x-[80%] opacity-0 pointer-events-none'}`}>
          <div className="w-full max-w-[320px] mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Registration</h2>
            
            {isSignUp && error && <p className="text-red-500 text-xs mb-3 bg-red-50 p-2 rounded">{error}</p>}

            <form className="w-full space-y-3 text-left" onSubmit={handleRegisterSubmit}>
              <div className="relative w-full h-[42px]">
                <input type="text" placeholder="Full Name *" value={regData.fullname} onChange={(e) => setRegData({...regData, fullname: e.target.value})} className="w-full h-full bg-gray-100 border-none outline-none rounded-lg px-[16px] text-sm text-gray-800 focus:ring-2 focus:ring-[#C85C2C]" required />
                <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="relative w-full h-[42px]">
                <input type="text" placeholder="Username *" value={regData.username} onChange={(e) => setRegData({...regData, username: e.target.value})} className="w-full h-full bg-gray-100 border-none outline-none rounded-lg px-[16px] text-sm text-gray-800 focus:ring-2 focus:ring-[#C85C2C]" required />
                <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="relative w-full h-[42px]">
                <input type="email" placeholder="Email *" value={regData.email} onChange={(e) => setRegData({...regData, email: e.target.value})} className="w-full h-full bg-gray-100 border-none outline-none rounded-lg px-[16px] text-sm text-gray-800 focus:ring-2 focus:ring-[#C85C2C]" required />
                <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Registration Password Input with Toggle */}
              <div className="relative w-full h-[42px]">
                <input 
                  type={showRegPassword ? "text" : "password"} 
                  placeholder="Password *" 
                  value={regData.password} 
                  onChange={(e) => setRegData({...regData, password: e.target.value})} 
                  className="w-full h-full bg-gray-100 border-none outline-none rounded-lg pl-[16px] pr-[40px] text-sm text-gray-800 focus:ring-2 focus:ring-[#C85C2C]" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showRegPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              <div className="space-y-0.5">
                <label className="text-[11px] font-bold text-gray-500 pl-1">Avatar Image *</label>
                <div className="relative w-full h-[36px] flex items-center bg-gray-100 rounded-lg px-3 focus-within:ring-2 focus-within:ring-[#C85C2C]">
                  <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-3 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-[#fff0eb] file:text-[#C85C2C] cursor-pointer" required />
                  <FaImage className="text-gray-400" />
                </div>
              </div>
              <div className="space-y-0.5">
                <label className="text-[11px] font-bold text-gray-500 pl-1">Cover Image</label>
                <div className="relative w-full h-[36px] flex items-center bg-gray-100 rounded-lg px-3 focus-within:ring-2 focus-within:ring-[#C85C2C]">
                  <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-3 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-[#fff0eb] file:text-[#C85C2C] cursor-pointer" />
                  <FaImage className="text-gray-400" />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full h-[42px] bg-[#C85C2C] text-white text-sm font-semibold rounded-lg hover:bg-[#a64b23] mt-3 disabled:opacity-70">
                {loading ? 'Uploading & Registering...' : 'Register'}
              </button>
            </form>
          </div>
        </div>

        {/* SLIDING OVERLAY PANEL */}
        <div className={`absolute top-0 w-1/2 h-full bg-[#C85C2C] z-20 transition-all duration-700 ease-in-out flex flex-col justify-center items-center text-center overflow-hidden
          ${isSignUp ? 'left-0 rounded-r-[150px]' : 'left-[50%] rounded-l-[150px]'}`}>
          
          <div className={`absolute inset-0 flex flex-col justify-center items-center px-10 transition-all duration-700 ease-in-out ${isSignUp ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0 pointer-events-none'}`}>
            <h2 className="text-3xl font-bold text-white mb-4">Welcome Back!</h2>
            <p className="text-sm text-white/90 mb-8">Already have an account?</p>
            <button onClick={() => {setIsSignUp(false); setError('');}} className="w-[160px] h-[46px] border-2 border-white text-white font-semibold rounded-lg bg-transparent hover:bg-white hover:text-[#C85C2C] transition-all duration-300">
              Login
            </button>
          </div>

          <div className={`absolute inset-0 flex flex-col justify-center items-center px-10 transition-all duration-700 ease-in-out ${!isSignUp ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0 pointer-events-none'}`}>
            <h2 className="text-3xl font-bold text-white mb-4">Hello, Welcome!</h2>
            <p className="text-sm text-white/90 mb-8">Don't have an account?</p>
            <button onClick={() => {setIsSignUp(true); setError('');}} className="w-[160px] h-[46px] border-2 border-white text-white font-semibold rounded-lg bg-transparent hover:bg-white hover:text-[#C85C2C] transition-all duration-300">
              Register
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}