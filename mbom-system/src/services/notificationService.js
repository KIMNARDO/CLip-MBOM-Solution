/**
 * 알림 서비스 - 서버 기반 알림 관리
 * WebSocket을 통한 실시간 알림과 REST API를 통한 알림 관리
 */

class NotificationService {
  constructor() {
    this.ws = null;
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/notifications';
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Set();
    this.messageQueue = [];
    this.isConnected = false;
    this.userId = null;
  }

  /**
   * WebSocket 연결 초기화
   */
  connect(userId) {
    this.userId = userId;

    try {
      this.ws = new WebSocket(`${this.wsUrl}?userId=${userId}`);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // 큐에 있던 메시지 전송
        this.flushMessageQueue();

        // 연결 성공 알림
        this.notifyListeners({
          type: 'connection',
          status: 'connected'
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          this.handleNotification(notification);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyListeners({
          type: 'connection',
          status: 'error',
          error
        });
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyListeners({
          type: 'connection',
          status: 'disconnected'
        });

        // 자동 재연결
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  /**
   * WebSocket 재연결 시도
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      setTimeout(() => {
        if (!this.isConnected && this.userId) {
          this.connect(this.userId);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyListeners({
        type: 'connection',
        status: 'failed',
        message: 'Unable to establish connection to notification server'
      });
    }
  }

  /**
   * 메시지 큐 비우기
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * WebSocket으로 메시지 전송
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // 연결이 안 되어 있으면 큐에 저장
      this.messageQueue.push(message);
    }
  }

  /**
   * 알림 처리
   */
  handleNotification(notification) {
    // 타임스탬프 추가
    notification.timestamp = notification.timestamp || Date.now();
    notification.id = notification.id || Date.now();

    // 알림 유형별 처리
    switch (notification.category) {
      case 'system':
        this.handleSystemNotification(notification);
        break;
      case 'bom':
        this.handleBOMNotification(notification);
        break;
      case 'user':
        this.handleUserNotification(notification);
        break;
      default:
        this.notifyListeners(notification);
    }
  }

  /**
   * 시스템 알림 처리
   */
  handleSystemNotification(notification) {
    // 시스템 알림은 항상 표시
    notification.priority = 'high';
    notification.persist = true;
    this.notifyListeners(notification);
  }

  /**
   * BOM 관련 알림 처리
   */
  handleBOMNotification(notification) {
    // BOM 변경 알림 처리
    notification.category = 'bom';
    this.notifyListeners(notification);
  }

  /**
   * 사용자 알림 처리
   */
  handleUserNotification(notification) {
    notification.category = 'user';
    this.notifyListeners(notification);
  }

  /**
   * REST API를 통한 알림 가져오기
   */
  async fetchNotifications(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${this.apiUrl}/notifications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // WebSocket으로도 읽음 상태 전송
      this.send({
        type: 'mark_read',
        notificationId
      });

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  /**
   * 알림 설정 업데이트
   */
  async updateNotificationSettings(settings) {
    try {
      const response = await fetch(`${this.apiUrl}/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.settings;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return null;
    }
  }

  /**
   * 리스너 추가
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * 리스너 제거
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * 모든 리스너에게 알림
   */
  notifyListeners(notification) {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * 인증 토큰 가져오기
   */
  getAuthToken() {
    // localStorage에서 토큰 가져오기
    return localStorage.getItem('authToken') || '';
  }

  /**
   * 연결 해제
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.userId = null;
    this.listeners.clear();
    this.messageQueue = [];
  }

  /**
   * 연결 상태 확인
   */
  isConnected() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스
const notificationService = new NotificationService();

export default notificationService;