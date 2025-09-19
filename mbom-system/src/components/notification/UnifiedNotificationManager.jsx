import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const UnifiedNotificationManager = () => {
  const { notifications, removeNotification, clearAllNotifications } = useNotification();
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
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
    switch(type) {
      case 'success': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      case 'info': return '#2196f3';
      case 'approval': return '#9c27b0';
      case 'sync': return '#00bcd4';
      case 'change': return '#ff5722';
      default: return '#607d8b';
    }
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
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          background: unreadCount > 0 ? '#007acc' : '#5a5a5a',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          transition: 'all 0.3s'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        title={`${unreadCount} 개의 읽지 않은 알림`}
      >
        <span style={{ color: '#fff', fontSize: '20px' }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: '#f44336',
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
            top: '70px',
            right: '20px',
            width: '380px',
            maxHeight: '500px',
            background: 'var(--vscode-editor-background)',
            border: '1px solid var(--vscode-panel-border)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '15px',
              borderBottom: '1px solid var(--vscode-panel-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              color: 'var(--vscode-text-foreground)'
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
                    color: 'var(--vscode-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '4px 8px'
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
                  color: 'var(--vscode-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '18px'
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
              maxHeight: '400px'
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--vscode-text-secondary)'
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
                    padding: '12px 15px',
                    borderBottom: '1px solid var(--vscode-panel-border)',
                    background: notification.read ? 'transparent' : 'rgba(0, 122, 204, 0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read ?
                      'transparent' : 'rgba(0, 122, 204, 0.05)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '20px',
                        color: getNotificationColor(notification.type)
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: notification.read ? 'normal' : 'bold',
                          color: 'var(--vscode-text-foreground)',
                          marginBottom: '4px'
                        }}
                      >
                        {notification.message}
                      </div>
                      {notification.details && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--vscode-text-secondary)',
                            marginBottom: '4px'
                          }}
                        >
                          {notification.details}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--vscode-text-secondary)'
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
                padding: '10px 15px',
                borderTop: '1px solid var(--vscode-panel-border)',
                fontSize: '12px',
                color: 'var(--vscode-text-secondary)',
                textAlign: 'center'
              }}
            >
              총 {notifications.length}개 알림 ({unreadCount}개 읽지 않음)
            </div>
          )}
        </div>
      )}

      {/* Toast Notifications */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '10px',
          pointerEvents: 'none'
        }}
      >
        {notifications.slice(0, 3).map(notification => (
          <div
            key={notification.id}
            style={{
              background: 'var(--vscode-editor-background)',
              border: `2px solid ${getNotificationColor(notification.type)}`,
              borderRadius: '6px',
              padding: '12px 15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: '300px',
              maxWidth: '400px',
              animation: 'slideIn 0.3s ease',
              pointerEvents: 'auto'
            }}
          >
            <span style={{ fontSize: '20px' }}>
              {getNotificationIcon(notification.type)}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--vscode-text-foreground)',
                  fontWeight: '500'
                }}
              >
                {notification.message}
              </div>
              {notification.details && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--vscode-text-secondary)',
                    marginTop: '2px'
                  }}
                >
                  {notification.details}
                </div>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--vscode-text-secondary)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0'
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default UnifiedNotificationManager;