/**
 * AuthContext – manages authentication state & token storage
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { sendOTP as apiSendOTP, verifyOTP as apiVerifyOTP, getProfile } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('token');
        if (savedToken) {
          setToken(savedToken);
          const { data } = await getProfile();
          setUser(data.user);
          connectSocket(savedToken);
        }
      } catch {
        await SecureStore.deleteItemAsync('token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sendOTP = async (phone_number, name) => {
    const { data } = await apiSendOTP(phone_number, name);
    return data; // { user_id, dev_otp? }
  };

  const verifyOTP = async (phone_number, otp) => {
    const { data } = await apiVerifyOTP(phone_number, otp);
    await SecureStore.setItemAsync('token', data.token);
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.token);
    return data;
  };

  const logout = async () => {
    disconnectSocket();
    await SecureStore.deleteItemAsync('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, sendOTP, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
