import React, { createContext, useState, useContext } from 'react';
import { isUniversityEmail } from '../utils/auth';

const AuthContext = createContext(null);

function isValidUser(user) {
  if (
    !user ||
    typeof user !== 'object' ||
    typeof user._id !== 'string' ||
    user._id.length === 0 ||
    (user.role !== 'admin' && user.role !== 'participant')
  ) {
    return false;
  }
  // Participants must have a university email on file
  if (user.role === 'participant' && !isUniversityEmail(user.email)) {
    return false;
  }
  return true;
}

function readStoredUser() {
  try {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    const parsed = JSON.parse(savedUser);
    if (!isValidUser(parsed)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());

  const login = (userData) => {
    if (!isValidUser(userData)) {
      console.error('Ignored invalid login payload. Expected a user object with _id and role.');
      return;
    }
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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
      value={{ user, login, logout, isValidUser, isAdmin, isParticipant }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
