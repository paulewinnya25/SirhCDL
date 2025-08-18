import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (from session storage)
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Une erreur est survenue lors de la vérification de l\'authentification');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.login({ email, password });
      const userData = response.data;
      
      // Store user data in state and session storage
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Erreur de connexion');
      return { success: false, error: err.message || 'Identifiants incorrects' };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  // Auth context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;