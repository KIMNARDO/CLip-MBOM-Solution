import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 알람 대시보드 컴포넌트
 * 알림 목록을 표시하는 팝업
 */
export const AlarmDashboard = ({ show, alarms, onClose, onClearAll }) => {
  const { theme } = useTheme();
  if (!show) return null;

  const getTypeColor = (type) => {
    if (theme === 'dark') {
      switch (type) {
        case 'error': return 'text-red-400 bg-red-900/20';
        case 'warning': return 'text-yellow-400 bg-yellow-900/20';
        case 'info': return 'text-blue-400 bg-blue-900/20';
        case 'success': return 'text-green-400 bg-green-900/20';
        default: return 'text-gray-400 bg-gray-900/20';
      }
    } else {
      switch (type) {
        case 'error': return 'text-red-600 bg-red-100';
        case 'warning': return 'text-yellow-600 bg-yellow-100';
        case 'info': return 'text-blue-600 bg-blue-100';
        case 'success': return 'text-green-600 bg-green-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '📢';
    }
  };

  return (
    <div className={`fixed bottom-8 right-4 w-96 rounded-lg shadow-2xl z-50 ${theme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}>
      <div className={`flex justify-between items-center px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-sm font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          🔔 알림 센터
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
            {alarms.filter(a => a.active).length}
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onClearAll}
            className={`text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            모두 읽음
          </button>
          <button
            onClick={onClose}
            className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {alarms.length === 0 ? (
          <div className={`p-4 text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
            알림이 없습니다.
          </div>
        ) : (
          alarms.map(alarm => (
            <div
              key={alarm.id}
              className={`px-4 py-3 border-b transition-colors ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              } ${
                alarm.active ? (theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50') : 'opacity-60'
              } ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getTypeIcon(alarm.type)}</span>
                <div className="flex-1">
                  <div className={`text-sm ${getTypeColor(alarm.type)} px-2 py-0.5 rounded inline-block`}>
                    {alarm.type.toUpperCase()}
                  </div>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{alarm.message}</p>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>{alarm.time}</p>
                </div>
                {alarm.active && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};