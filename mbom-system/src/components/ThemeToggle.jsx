import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400 transition-all duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700 transition-all duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;