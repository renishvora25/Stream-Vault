import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export default function ProtectedRoute({ children }) {
  // Start with 'null' so we know we are actively checking
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await axios.get('/api/v1/users/current-user', {
          withCredentials: true
        });
        
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isAuthenticated === null) {
    return <div className="h-screen w-full bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}