// notification-system.js - Vaccine Notification System
// ระบบแจ้งเตือนวัคซีนที่ครบกำหนด

class NotificationSystem {
    constructor() {
        this.API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) 
            ? CONFIG.API_URL 
            : 'http://localhost:3000/api';
        this.notifications = [];
        this.checkInterval = null;
    }

    // เริ่มต้นระบบแจ้งเตือน
    init() {
        const token = localStorage.getItem('token');
        if (token) {
            this.loadNotifications();
            // เช็คการแจ้งเตือนทุก 5 นาที
            this.checkInterval = setInterval(() => {
                this.loadNotifications();
            }, 5 * 60 * 1000);
        }
    }

    // โหลดการแจ้งเตือนทั้งหมด
    async loadNotifications() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${this.API_URL}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('Failed to load notifications:', response.status);
                return;
            }

            this.notifications = await response.json();
            this.updateBadge();
            
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    // อัพเดท badge แสดงจำนวนการแจ้งเตือน
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.is_read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // คำนวณจำนวนวันจนถึงวันที่กำหนด
    calculateDaysUntil(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // หยุดระบบแจ้งเตือน
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// สร้าง instance และเริ่มต้นอัตโนมัติ
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.notificationSystem = new NotificationSystem();
        window.notificationSystem.init();
    });
} else {
    window.notificationSystem = new NotificationSystem();
    window.notificationSystem.init();
}

// Export สำหรับใช้งานภายนอก
window.NotificationSystem = NotificationSystem;
