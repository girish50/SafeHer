import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('safeher_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('safeher_token', res.data.access_token);
    localStorage.setItem('safeher_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/api/auth/register', payload);
    localStorage.setItem('safeher_token', res.data.access_token);
    localStorage.setItem('safeher_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('safeher_token');
    localStorage.removeItem('safeher_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/api/auth/me');
    localStorage.setItem('safeher_user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
