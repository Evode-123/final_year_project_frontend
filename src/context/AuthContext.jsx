import React, { createContext, useState, useEffect, useContext } from 'react';
import apiService from '../services/apiService';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user and token from sessionStorage on mount
    const storedToken = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = sessionStorage.getItem(STORAGE_KEYS.USER);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await apiService.login(email, password);
    
    const userData = {
      email,
      role: response.role,
      mustChangePassword: response.mustChangePassword,
      profileCompleted: response.profileCompleted,
      firstName: response.firstName || '',
      lastName: response.lastName || '',
    };

    setToken(response.token);
    setUser(userData);
    sessionStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

    return response;
  };

  const register = async (data) => {
    const response = await apiService.register(data);
    
    const userData = {
      email: data.email,
      role: response.role,
      mustChangePassword: false,
      profileCompleted: true,
      firstName: response.firstName || data.firstName,
      lastName: response.lastName || data.lastName,
    };

    setToken(response.token);
    setUser(userData);
    sessionStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

    return response;
  };

  const updateUserState = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUserState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};