// navbar.js - Complete Version with Notifications & Profile
// วางไฟล์นี้ที่ public/js/navbar.js

class NavigationBar {
    constructor(options = {}) {
        this.currentPage = this.detectCurrentPage();
        this.API_URL = this.getApiUrl();
        this.init();
    }

    getApiUrl() {
        return (typeof CONFIG !== 'undefined' && CONFIG.API_URL) 
            ? CONFIG.API_URL 
            : 'http://localhost:3000/api';
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('index.html') || path.endsWith('/')) return 'home';
        if (path.includes('blog-detail')) return 'blog';
        if (path.includes('blog')) return 'blog';
        if (path.includes('your-pet')) return 'your-pet';
        if (path.includes('pet-details')) return 'your-pet';
        if (path.includes('vaccination-record')) return 'your-pet';
        if (path.includes('vaccine-notification')) return 'your-pet';
        if (path.includes('pet-breeds')) return 'pet-breeds';
        return '';
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.updateAuthState();
    }

    getNavbarHTML() {
        return `
            <nav class="navbar">
                <a href="index.html" class="navbar-brand">
                    <img src="/icon/cat.png" alt="Logo" style="width:35px;height:35px;">
                    <span class="brand-text">Petizo</span>
                </a>

                <ul class="nav-menu">
                    <li><a href="index.html" class="nav-link ${this.currentPage === 'home' ? 'active' : ''}">Home</a></li>
                    <li><a href="blog.html" class="nav-link ${this.currentPage === 'blog' ? 'active' : ''}">Blog</a></li>
                    <li><a href="your-pet.html" class="nav-link ${this.currentPage === 'your-pet' ? 'active' : ''}" id="yourPetLink">Your Pet</a></li>
                    <li><a href="#" class="nav-link ${this.currentPage === 'pet-breeds' ? 'active' : ''}">Pet Breeds</a></li>
                </ul>

                <!-- Guest State -->
                <div class="nav-actions" id="navActionsGuest">
                    <button class="btn-login">Log in</button>
                    <button class="btn-signup">Sign up</button>
                </div>

                <!-- User State -->
                <div class="nav-actions hidden" id="navActionsUser">
                    <span id="userDisplayName" style="color: #666; font-weight: 500; margin-right: 12px;"></span>
                    <button class="icon-btn" id="notificationBtn">
                        <img src="/icon/alarm.png" alt="Notification" style="width:40px;height:40px;">
                        <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                    </button>
                    <div class="profile-dropdown">
                        <button class="icon-btn" id="profileBtn" title="โปรไฟล์" onclick="(function(e){e.stopPropagation(); const dd=document.getElementById('profileDropdown'); if(dd) dd.classList.toggle('show'); })(event)">
                            <img src="/icon/profile.png" alt="User" style="width:35px;height:35px;">
                        </button>
                        <div class="dropdown-menu" id="profileDropdown">
                            <a href="user-profile.html" class="dropdown-item">
                                <img src="/icon/profile.png" alt="User" style="width:30px;height:30px;">
                                <span>ข้อมูลผู้ใช้งาน</span>
                            </a>
                            <button class="dropdown-item logout">
                                <img src="/icon/logout.png" alt="Log Out" style="width:30px;height:30px;">
                                <span>ออกจากระบบ</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Notification Modal -->
            <div class="notification-modal" id="notificationModal">
                <div class="notification-content">
                    <div class="notification-header">
                        <h2>
                            <span>🔔</span>
                            <span>การแจ้งเตือนวัคซีน</span>
                        </h2>
                        <button class="close-modal-btn" id="closeNotificationBtn">×</button>
                    </div>
                    
                    <div class="notification-body" id="notificationList">
                        <div class="loading">
                            <div class="spinner"></div>
                            <div>กำลังโหลดการแจ้งเตือน...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        const container = document.getElementById('navbar-container');
        if (container) {
            container.innerHTML = this.getNavbarHTML();
        }
    }

    attachEventListeners() {
        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.profile-dropdown')) {
                    profileDropdown.classList.remove('show');
                }
            });
        }

        // Login/Signup buttons
        const loginBtn = document.querySelector('.btn-login');
        const signupBtn = document.querySelector('.btn-signup');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
        
        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                window.location.href = 'register.html';
            });
        }

        // // Logout button
        // const logoutBtn = document.querySelector('.dropdown-item.logout');
        // if (logoutBtn) {
        //     logoutBtn.addEventListener('click', () => {
        //         if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
        //             localStorage.removeItem('token');
        //             localStorage.removeItem('user');
        //             window.location.href = 'index.html';
        //         }
        //     });
        // }

        // Your Pet link protection
        const yourPetLink = document.getElementById('yourPetLink');
        if (yourPetLink) {
            yourPetLink.addEventListener('click', (e) => {
                const token = localStorage.getItem('token');
                if (!token) {
                    e.preventDefault();
                    alert('กรุณาเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้า Your Pet');
                    window.location.href = 'login.html';
                }
            });
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.toggleNotificationModal();
            });
        }

        // Close notification modal
        const closeNotificationBtn = document.getElementById('closeNotificationBtn');
        if (closeNotificationBtn) {
            closeNotificationBtn.addEventListener('click', () => {
                this.toggleNotificationModal();
            });
        }

        // Close modal on backdrop click
        const notificationModal = document.getElementById('notificationModal');
        if (notificationModal) {
            notificationModal.addEventListener('click', (e) => {
                if (e.target.id === 'notificationModal') {
                    this.toggleNotificationModal();
                }
            });
        }
    }

    updateAuthState() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        const guestActions = document.getElementById('navActionsGuest');
        const userActions = document.getElementById('navActionsUser');
        const userDisplayName = document.getElementById('userDisplayName');

        if (token && user) {
            if (guestActions) guestActions.classList.add('hidden');
            if (userActions) userActions.classList.remove('hidden');
            
            try {
                const userData = JSON.parse(user);
                if (userDisplayName) {
                    userDisplayName.textContent = userData.first_name || userData.username || 'User';
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }

            // Load notifications
            this.loadNotifications();
        } else {
            if (guestActions) guestActions.classList.remove('hidden');
            if (userActions) userActions.classList.add('hidden');
        }
    }

    toggleNotificationModal() {
        const modal = document.getElementById('notificationModal');
        if (modal) {
            const isShowing = modal.classList.contains('show');
            if (isShowing) {
                modal.classList.remove('show');
            } else {
                modal.classList.add('show');
                // Reload notifications when opening
                this.loadNotifications();
            }
        }
    }

    async loadNotifications() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const notificationList = document.getElementById('notificationList');
        const notificationBadge = document.getElementById('notificationBadge');
        
        if (!notificationList) return;

        try {
            const response = await fetch(`${this.API_URL}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load notifications');

            const notifications = await response.json();
            console.log('📢 Loaded notifications:', notifications);
            
            // Update badge
            const unreadCount = notifications.filter(n => !n.is_read).length;
            if (notificationBadge) {
                if (unreadCount > 0) {
                    notificationBadge.textContent = unreadCount;
                    notificationBadge.style.display = 'block';
                } else {
                    notificationBadge.style.display = 'none';
                }
            }

            // Display notifications
            if (notifications.length === 0) {
                notificationList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
                        <p>ไม่มีการแจ้งเตือน</p>
                    </div>
                `;
            } else {
                notificationList.innerHTML = notifications.map(notification => {
                    const daysUntil = this.calculateDaysUntil(notification.next_due_date);
                    const urgencyClass = daysUntil <= 7 ? 'urgent' : '';
                    const urgencyText = daysUntil < 0 ? 'เลยกำหนด!' : 
                                       daysUntil === 0 ? 'วันนี้!' : 
                                       daysUntil <= 7 ? `เหลือ ${daysUntil} วัน` : 
                                       `อีก ${daysUntil} วัน`;

                    return `
                        <div class="notification-item ${urgencyClass}" onclick="window.location.href='pet-details.html?id=${notification.pet_id}'">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                <strong style="color: #1a1a1a;">${notification.pet_name}</strong>
                                <span style="background: ${daysUntil <= 7 ? '#ff4757' : '#00bcd4'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                    ${urgencyText}
                                </span>
                            </div>
                            <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                                💉 ${notification.vaccine_name}
                            </div>
                            <div style="color: #999; font-size: 13px;">
                                📅 ครั้งถัดไป: ${new Date(notification.next_due_date).toLocaleDateString('th-TH')}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            notificationList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <p>ไม่สามารถโหลดการแจ้งเตือนได้</p>
                </div>
            `;
        }
    }

    calculateDaysUntil(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // Static method for external use
    static updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    static refreshAuth() {
        const navbar = new NavigationBar();
        navbar.updateAuthState();
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.navbar = new NavigationBar();
    });
} else {
    window.navbar = new NavigationBar();
}

// Export for external use
window.NavigationBar = NavigationBar;