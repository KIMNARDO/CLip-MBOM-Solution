import React, { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';

const UnifiedNotificationManager = () => {
  const { theme } = useTheme();
  const { notifications, removeNotification, clearAllNotifications, markAsRead } = useNotification();
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);

    // 새 알림이 있을 때 벨 아이콘 애니메이션 효과
    if (unread > 0) {
      const bellIcon = document.querySelector('.notification-bell');
      if (bellIcon) {
        bellIcon.style.animation = 'bellShake 0.3s';
        setTimeout(() => {
          if (bellIcon) bellIcon.style.animation = '';
        }, 300);
      }
    }
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'approval': return '📋';
      case 'sync': return '🔄';
      case 'change': return '📝';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    const colors = {
      dark: {
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
        approval: '#9c27b0',
        sync: '#00bcd4',
        change: '#ff5722',
        default: '#607d8b'
      },
      light: {
        success: '#2e7d32',
        warning: '#ed6c02',
        error: '#d32f2f',
        info: '#0288d1',
        approval: '#7b1fa2',
        sync: '#00838f',
        change: '#d84315',
        default: '#455a64'
      }
    };
    const themeColors = theme === 'dark' ? colors.dark : colors.light;
    return themeColors[type] || themeColors.default;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <div
        className="notification-bell"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '20px',
          width: '40px',
          height: '40px',
          background: unreadCount > 0 ? (theme === 'dark' ? '#ff6b6b' : '#ef4444') : (theme === 'dark' ? '#3c3c3c' : '#9ca3af'),
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
          border: unreadCount > 0 ? (theme === 'dark' ? '2px solid #ffcc00' : '2px solid #fbbf24') : (theme === 'dark' ? '1px solid #505050' : '1px solid #d1d5db'),
          transition: 'all 0.3s'
        }}
        onClick={() => {
          setIsExpanded(!isExpanded);
          // 패널을 열면 알림을 읽음으로 표시
          if (!isExpanded && notifications.length > 0) {
            notifications.forEach(n => {
              if (!n.read && markAsRead) {
                markAsRead(n.id);
              }
            });
          }
        }}
        title={`${unreadCount} 개의 읽지 않은 알림`}
      >
        <span style={{ color: '#fff', fontSize: '20px' }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: theme === 'dark' ? '#f44336' : '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            {unreadCount}
          </span>
        )}
      </div>

      {/* Notification Panel */}
      {isExpanded && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '320px',
            maxHeight: '400px',
            background: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            border: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px',
              borderBottom: theme === 'dark' ? '1px solid #3c3c3c' : '1px solid #e5e7eb',
              background: theme === 'dark' ? '#252526' : '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '6px 6px 0 0'
            }}
          >
            <h3 style={{
              margin: 0,
              fontSize: '14px',
              color: theme === 'dark' ? '#cccccc' : '#111827',
              fontWeight: '600'
            }}>
              알림 센터
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: theme === 'dark' ? '#969696' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '2px 6px',
                    hover: { color: '#cccccc' }
                  }}
                  title="모두 삭제"
                >
                  모두 삭제
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme === 'dark' ? '#969696' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0 4px'
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '300px',
              background: theme === 'dark' ? '#1e1e1e' : '#ffffff'
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '30px',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#969696' : '#6b7280'
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                <div>새로운 알림이 없습니다</div>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
                    padding: '10px 12px',
                    borderBottom: theme === 'dark' ? '1px solid #2d2d30' : '1px solid #e5e7eb',
                    background: notification.read ? (theme === 'dark' ? '#1e1e1e' : '#ffffff') : (theme === 'dark' ? '#252526' : '#f3f4f6'),
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme === 'dark' ? '#2d2d30' : '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read ?
                      (theme === 'dark' ? '#1e1e1e' : '#ffffff') : (theme === 'dark' ? '#252526' : '#f3f4f6');
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '18px',
                        color: getNotificationColor(notification.type)
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: notification.read ? 'normal' : '600',
                          color: notification.read ? (theme === 'dark' ? '#969696' : '#6b7280') : (theme === 'dark' ? '#cccccc' : '#111827'),
                          marginBottom: '3px'
                        }}
                      >
                        {notification.message}
                      </div>
                      {notification.details && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: theme === 'dark' ? '#808080' : '#9ca3af',
                            marginBottom: '3px'
                          }}
                        >
                          {notification.details}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '10px',
                          color: theme === 'dark' ? '#606060' : '#9ca3af'
                        }}
                      >
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--vscode-text-secondary)',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0'
                      }}
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid #3c3c3c',
                background: '#252526',
                fontSize: '11px',
                color: '#808080',
                textAlign: 'center',
                borderRadius: '0 0 6px 6px'
              }}
            >
              총 {notifications.length}개 알림 ({unreadCount}개 읽지 않음)
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          50% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
        }
      `}</style>
    </>
  );
};

export default UnifiedNotificationManager;