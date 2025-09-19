import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, Bell, User, LogOut, Home, Settings, BarChart3 } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">M-BOM System</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-1 ml-8">
            <button className="btn btn-ghost btn-sm">
              <Home className="w-4 h-4 mr-2" />
              홈
            </button>
            <button className="btn btn-ghost btn-sm text-primary">
              <Package className="w-4 h-4 mr-2" />
              Multi-BOM
            </button>
            <button className="btn btn-ghost btn-sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              보고서
            </button>
            <button className="btn btn-ghost btn-sm">
              <Settings className="w-4 h-4 mr-2" />
              설정
            </button>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <button className="btn btn-ghost btn-icon relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium hidden md:block">
              {user?.name || '사용자'}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-icon"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;