import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Package } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
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
    // Redirect if already authenticated
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
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full mx-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Package className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">M-BOM System</h1>
          <p className="text-muted-foreground mt-2">Manufacturing BOM Management</p>
        </div>

        {/* Login Card */}
        <div className="card bg-white shadow-lg">
          <div className="card-content p-8">
            <h2 className="text-2xl font-bold mb-6">로그인</h2>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User ID */}
              <div className="space-y-2">
                <label htmlFor="userId" className="label">
                  사용자 ID
                </label>
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="아이디를 입력하세요"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="label">
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
                    className="input pr-10"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                  className="checkbox"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm">
                  아이디 저장
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-default w-full"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2024 FabsNet. All rights reserved.</p>
          <p className="mt-1">EPL Multi-BOM System v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;