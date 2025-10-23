import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import buildingImg from '/building.jpg'; // DSC 동림연구소 건물 이미지

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for remembered user
    const rememberedUserId = localStorage.getItem('rememberedUserId');
    if (rememberedUserId) {
      setFormData(prev => ({
        ...prev,
        userId: rememberedUserId,
        rememberMe: true
      }));
    }
  }, []);

  useEffect(() => {
    // Redirect if already authenticated - 대시보드로 이동
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(
      formData.userId,
      formData.password,
      formData.rememberMe
    );

    if (result.success) {
      // 로그인 성공 시 대시보드로 이동
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with proper image handling */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${buildingImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better readability */}
        <div className={`absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-br from-black/70 via-gray-900/60 to-blue-900/50'
            : 'bg-gradient-to-br from-white/40 via-blue-50/30 to-sky-100/40'
        }`} />
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-20 p-3 rounded-full transition-all duration-300 ${
          isDark
            ? 'bg-gray-800/80 hover:bg-gray-700/90 backdrop-blur-md'
            : 'bg-white/80 hover:bg-white/90 backdrop-blur-md shadow-lg'
        }`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-6 h-6 text-yellow-400" />
        ) : (
          <Moon className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <h1 className={`text-5xl font-bold mb-3 ${
              isDark
                ? 'text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]'
                : 'text-gray-900 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]'
            }`}>
              M-BOM System
            </h1>
            <p className={`text-xl font-semibold ${
              isDark
                ? 'text-blue-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'
                : 'text-blue-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]'
            }`}>
              Manufacturing BOM Management
            </p>
            <p className={`text-sm mt-2 font-medium ${
              isDark
                ? 'text-gray-300'
                : 'text-gray-700'
            }`}>
              (주)팹스넷 CLip Solution
            </p>
          </div>

          {/* Login Card */}
          <div className={`rounded-2xl shadow-2xl backdrop-blur-xl border ${
            isDark
              ? 'bg-gray-900/85 border-gray-700/50'
              : 'bg-white/95 border-gray-200/50'
          }`}>
            <div className="p-8">
              <h2 className={`text-3xl font-bold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                로그인
              </h2>

              {error && (
                <div className={`p-3 rounded-lg mb-4 ${
                  isDark
                    ? 'bg-red-900/50 text-red-200 border border-red-700/50'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* User ID */}
                <div className="space-y-2">
                  <label htmlFor="userId" className={`block text-sm font-semibold ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    사용자 ID
                  </label>
                  <input
                    id="userId"
                    name="userId"
                    type="text"
                    value={formData.userId}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                      isDark
                        ? 'bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-gray-800'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="아이디를 입력하세요"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className={`block text-sm font-semibold ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200 ${
                        isDark
                          ? 'bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:bg-gray-800'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      placeholder="비밀번호를 입력하세요"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                        isDark
                          ? 'text-gray-400 hover:text-gray-200'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className={`w-4 h-4 rounded border ${
                      isDark
                        ? 'bg-gray-800 border-gray-600 text-blue-500'
                        : 'bg-white border-gray-300 text-blue-600'
                    } focus:ring-2 focus:ring-blue-500/20`}
                  />
                  <label htmlFor="rememberMe" className={`ml-2 text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    아이디 저장
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                    loading
                      ? 'bg-gray-500 cursor-not-allowed'
                      : isDark
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      로그인 중...
                    </span>
                  ) : '로그인'}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className={`text-center mt-8 text-sm ${
            isDark ? 'text-white-300' : 'text-white-700'
          }`}>
            <p className="font-medium">© 2025 Papsnet Clip Solution. All rights reserved.</p>
            <p className="mt-1">CLIP Multi-BOM System v1.0</p>
            <p className={`mt-2 text-xs ${
              isDark ? 'text-white-400' : 'text-white-600'
            }`}>
              DSC동탄연구소 - POC Solution TEST
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;