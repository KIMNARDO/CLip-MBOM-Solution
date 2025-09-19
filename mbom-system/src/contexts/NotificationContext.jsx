import React, { createContext, useState, useContext, useCallback } from 'react';

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

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: 'info',
      duration: 3000,
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
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const value = {
    notifications,
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
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

// Notification Container Component
const NotificationContainer = ({ notifications, removeNotification }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`
            alert max-w-md shadow-lg animate-slide-in-right
            ${notif.type === 'success' && 'alert-success'}
            ${notif.type === 'error' && 'alert-error'}
            ${notif.type === 'warning' && 'alert-warning'}
            ${notif.type === 'info' && 'alert-info'}
          `}
        >
          <div className="flex justify-between items-start">
            <div>
              {notif.title && (
                <h3 className="font-semibold mb-1">{notif.title}</h3>
              )}
              <p>{notif.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="ml-4 text-current opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};