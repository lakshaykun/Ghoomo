import React, { createContext, useContext, useEffect, useState } from 'react';
import dashboardAPI from '../services/dashboardAPI';

const AuthContext = createContext();

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

function isAllowedRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'admin' || normalized === 'operator';
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (!token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (isAllowedRole(parsedUser?.role)) {
            if (active) {
              setUser(parsedUser);
              setIsAuthenticated(true);
            }
          }
        } catch (_error) {
          clearSession();
        }
      }

      try {
        const response = await dashboardAPI.getCurrentUser();
        const currentUser = response.data;

        if (!isAllowedRole(currentUser?.role)) {
          throw new Error('Only admin and operator accounts can access this portal.');
        }

        if (active) {
          setUser(currentUser);
          setIsAuthenticated(true);
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        }
      } catch (_error) {
        clearSession();

        if (active) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await dashboardAPI.login({ email, password });
      const { token, user: loggedInUser } = response.data;

      if (!isAllowedRole(loggedInUser?.role)) {
        throw new Error('Only admin or operator accounts can sign in to this portal.');
      }

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));

      setUser(loggedInUser);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      clearSession();

      throw new Error(error?.response?.data?.message || error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
