import React, { useState } from 'react';
import CompactLevelManager from '../level/CompactLevelManager';
import CompactAnalysisDashboard from '../dashboard/CompactAnalysisDashboard';
import { useNotification } from '../../contexts/NotificationContext';

const RightSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('levels'); // levels, analysis, notifications
  const { notifications } = useNotification();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{
      width: isExpanded ? '320px' : '48px',
      height: '100%',
      background: '#252526',
      borderLeft: '1px solid #3e3e42',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      position: 'relative'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: 'absolute',
          left: '-20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '20px',
          height: '60px',
          background: '#2d2d30',
          border: '1px solid #3e3e42',
          borderRight: 'none',
          borderRadius: '4px 0 0 4px',
          color: '#8b8b8b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          zIndex: 10
        }}
      >
        {isExpanded ? '▶' : '◀'}
      </button>

      {/* Tab Bar */}
      {isExpanded && (
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #3e3e42',
          background: '#2d2d30',
          minHeight: '35px'
        }}>
          <button
            onClick={() => setActiveTab('levels')}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === 'levels' ? '#1e1e1e' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'levels' ? '2px solid #007acc' : 'none',
              color: activeTab === 'levels' ? '#cccccc' : '#8b8b8b',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'levels' ? 'bold' : 'normal'
            }}
            title="레벨 관리"
          >
            📊 레벨
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === 'analysis' ? '#1e1e1e' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'analysis' ? '2px solid #007acc' : 'none',
              color: activeTab === 'analysis' ? '#cccccc' : '#8b8b8b',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'analysis' ? 'bold' : 'normal'
            }}
            title="분석 대시보드"
          >
            📈 분석
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === 'notifications' ? '#1e1e1e' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'notifications' ? '2px solid #007acc' : 'none',
              color: activeTab === 'notifications' ? '#cccccc' : '#8b8b8b',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === 'notifications' ? 'bold' : 'normal',
              position: 'relative'
            }}
            title="알림"
          >
            🔔 알림
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                background: '#f44336',
                color: '#fff',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold',
                minWidth: '16px',
                textAlign: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content Area */}
      {isExpanded && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '10px'
        }}>
          {activeTab === 'levels' && <CompactLevelManager />}
          {activeTab === 'analysis' && <CompactAnalysisDashboard />}
          {activeTab === 'notifications' && (
            <div style={{ padding: '10px' }}>
              {notifications.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#8b8b8b',
                  padding: '20px',
                  fontSize: '12px'
                }}>
                  알림이 없습니다
                </div>
              ) : (
                notifications.slice(0, 10).map(notif => (
                  <div key={notif.id} style={{
                    padding: '8px',
                    marginBottom: '8px',
                    background: notif.read ? '#1e1e1e' : '#2d2d30',
                    border: `1px solid ${notif.type === 'error' ? '#f44336' :
                            notif.type === 'warning' ? '#ff9800' :
                            notif.type === 'success' ? '#4caf50' : '#2196f3'}`,
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        color: notif.type === 'error' ? '#f44336' :
                               notif.type === 'warning' ? '#ff9800' :
                               notif.type === 'success' ? '#4caf50' : '#2196f3',
                        fontWeight: 'bold',
                        fontSize: '10px'
                      }}>
                        {notif.type.toUpperCase()}
                      </span>
                      {notif.time && (
                        <span style={{ color: '#8b8b8b', fontSize: '10px' }}>
                          {notif.time}
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#cccccc' }}>
                      {notif.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsed Icons */}
      {!isExpanded && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '10px',
          gap: '15px'
        }}>
          <button
            onClick={() => {
              setIsExpanded(true);
              setActiveTab('levels');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b8b8b',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '5px'
            }}
            title="레벨 관리"
          >
            📊
          </button>
          <button
            onClick={() => {
              setIsExpanded(true);
              setActiveTab('analysis');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b8b8b',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '5px'
            }}
            title="분석 대시보드"
          >
            📈
          </button>
          <button
            onClick={() => {
              setIsExpanded(true);
              setActiveTab('notifications');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b8b8b',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '5px',
              position: 'relative'
            }}
            title="알림"
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#f44336',
                color: '#fff',
                borderRadius: '10px',
                padding: '2px 4px',
                fontSize: '9px',
                fontWeight: 'bold',
                minWidth: '14px',
                textAlign: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default RightSidebar;