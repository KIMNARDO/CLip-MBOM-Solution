import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import clientNotificationService from '../services/clientNotificationService';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // 서비스 초기화
  useEffect(() => {
    // 리스너 등록
    const handleNotification = (notification) => {
      // 클라이언트 알림 추가
      setNotifications(prev => [...prev, notification]);

      // Auto-remove notification after duration
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
    };

    clientNotificationService.addListener(handleNotification);

    // 기존 알림 불러오기
    const existingNotifications = clientNotificationService.getNotifications({ unread: true });
    setNotifications(existingNotifications);

    // 연결 상태를 항상 true로 설정 (클라이언트 전용이므로)
    setIsConnected(true);

    // Cleanup
    return () => {
      clientNotificationService.removeListener(handleNotification);
    };
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: 'info',
      duration: 3000,
      timestamp: Date.now(),
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const showSuccess = useCallback((message, options = {}) => {
    addNotification({
      type: 'success',
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    addNotification({
      type: 'error',
      message,
      duration: 5000, // Errors stay longer
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    addNotification({
      type: 'warning',
      message,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    addNotification({
      type: 'info',
      message,
      ...options
    });
  }, [addNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id) => {
    // 클라이언트에서 알림 읽음 처리
    const success = clientNotificationService.markAsRead(id);
    if (success) {
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    }
  }, []);

  const value = {
    notifications,
    isConnected,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};