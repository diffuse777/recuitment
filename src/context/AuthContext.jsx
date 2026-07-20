import React, { createContext, useState, useContext } from 'react';
import { isUniversityEmail } from '../utils/auth';

const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  const id = user._id != null ? String(user._id) : '';
  if (!id) return null;
  if (user.role !== 'admin' && user.role !== 'participant') return null;
  if (user.role === 'participant' && !isUniversityEmail(user.email)) return null;
  return { ...user, _id: id };
}

function readStoredUser() {
  try {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    const parsed = normalizeUser(JSON.parse(savedUser));
    if (!parsed) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authType');
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('authType');
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());

  const login = (userData, options = {}) => {
    const normalized = normalizeUser(userData);
    if (!normalized) {
      console.error('Ignored invalid login payload. Expected a user object with _id and role.');
      return false;
    }
    if (options.token) {
      localStorage.setItem('token', options.token);
    }
    if (options.authType) {
      localStorage.setItem('authType', options.authType);
    }
    localStorage.setItem('user', JSON.stringify(normalized));
    setUser(normalized);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('authType');
  };

  const isAdmin = user?.role === 'admin';
  const isParticipant = user?.role === 'participant';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isValidUser: (u) => Boolean(normalizeUser(u)),
        isAdmin,
        isParticipant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
