import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Auto-login for development
  const [user, setUser] = useState({ id: 'test', name: 'Test User', role: 'admin', department: 'Engineering' });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (userId, password, rememberMe) => {
    try {
      // Simulate API call - replace with actual API
      // For demo purposes, accept any non-empty credentials
      if (userId && password) {
        const userData = {
          id: userId,
          name: userId,
          role: 'user',
          department: 'Engineering'
        };

        // Store auth data
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', 'demo-token-' + Date.now());

        if (rememberMe) {
          localStorage.setItem('rememberedUserId', userId);
        } else {
          localStorage.removeItem('rememberedUserId');
        }

        setUser(userData);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        return {
          success: false,
          error: '아이디와 비밀번호를 입력해주세요.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: '로그인 중 오류가 발생했습니다.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};