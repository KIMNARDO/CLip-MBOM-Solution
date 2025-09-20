/**
 * 클라이언트 전용 알림 서비스
 * 서버 없이 로컬에서만 작동하는 알림 시스템
 */

class ClientNotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = new Set();
    this.nextId = 1;
  }

  /**
   * 알림 추가
   */
  addNotification(notification) {
    const newNotification = {
      id: this.nextId++,
      timestamp: Date.now(),
      read: false,
      ...notification
    };

    this.notifications.push(newNotification);
    this.notifyListeners(newNotification);

    // 로컬 스토리지에 저장
    this.saveToLocalStorage();

    return newNotification.id;
  }

  /**
   * 알림 가져오기
   */
  getNotifications(params = {}) {
    let result = [...this.notifications];

    if (params.unread) {
      result = result.filter(n => !n.read);
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 알림 읽음 처리
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  /**
   * 알림 삭제
   */
  deleteNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  /**
   * 모든 알림 삭제
   */
  clearAllNotifications() {
    this.notifications = [];
    this.saveToLocalStorage();
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
   * 로컬 스토리지에 저장
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('mbom_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  }

  /**
   * 로컬 스토리지에서 불러오기
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('mbom_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
        // ID 카운터 업데이트
        if (this.notifications.length > 0) {
          this.nextId = Math.max(...this.notifications.map(n => n.id)) + 1;
        }
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
      this.notifications = [];
    }
  }

  /**
   * 초기화 (로컬 스토리지에서 데이터 불러오기)
   */
  initialize() {
    this.loadFromLocalStorage();
  }
}

// 싱글톤 인스턴스
const clientNotificationService = new ClientNotificationService();
clientNotificationService.initialize();

export default clientNotificationService;