// notification-system.js
// ระบบแจ้งเตือนวัคซีนสำหรับทุกหน้า

(function() {
    'use strict';

    const API_URL = 'http://localhost:3000/api';
    let currentNotifications = [];

    // Initialize notification system
    function initNotificationSystem() {
        // initializing notification system
        
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            // user not logged in; skip notification system
            return;
        }

        // Inject notification modal HTML
        injectNotificationModal();
        
        // Inject notification styles
        injectNotificationStyles();
        
        // Setup notification button click handler
        setupNotificationButton();
        
        // Load notifications on page load
        loadNotifications();
        
        // Auto-refresh every 5 minutes
        setInterval(() => {
            const token = localStorage.getItem('token');
            if (token) {
                loadNotifications();
            }
        }, 5 * 60 * 1000);
        
        // notification system initialized
    }

    // Inject notification modal HTML into page
    function injectNotificationModal() {
        // Check if modal already exists
        if (document.getElementById('notificationModal')) {
            return;
        }

        const modalHTML = `
            <div class="notification-modal" id="notificationModal" onclick="window.NotificationSystem.closeModalOnBackdrop(event)">
                <div class="notification-content">
                    <div class="notification-header">
                        <h2>
                            <span>🔔</span>
                            <span>การแจ้งเตือนวัคซีน</span>
                        </h2>
                        <button class="close-modal-btn" onclick="window.NotificationSystem.toggleModal()">×</button>
                    </div>
                    
                    <div class="notification-body" id="notificationList">
                        <div class="loading">
                            <div class="spinner"></div>
                            <div>กำลังโหลดการแจ้งเตือน...</div>
                        </div>
                    </div>

                    <div class="notification-footer">
                        <button class="view-all-btn" onclick="window.location.href='your-pet.html'">
                            ดูรายการสัตว์เลี้ยงทั้งหมด
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Inject notification styles
    function injectNotificationStyles() {
        // Check if styles already injected
        if (document.getElementById('notificationStyles')) {
            return;
        }

        const styles = `
            <style id="notificationStyles">
                /* Notification Modal */
                .notification-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .notification-modal.active {
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .notification-content {
                    background: white;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(50px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .notification-header {
                    padding: 24px;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .notification-header h2 {
                    font-size: 22px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 0;
                }

                .close-modal-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 20px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .close-modal-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: rotate(90deg);
                }

                .notification-body {
                    padding: 24px;
                    overflow-y: auto;
                    flex: 1;
                    max-height: 60vh;
                }

                .notification-item {
                    background: white;
                    border: 2px solid #e9ecef;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                    transition: all 0.3s;
                    cursor: pointer;
                }

                .notification-item:hover {
                    border-color: #00bcd4;
                    transform: translateX(4px);
                    box-shadow: 0 4px 12px rgba(0, 188, 212, 0.15);
                }

                .notification-item.urgent {
                    border-color: #ff4757;
                    background: linear-gradient(to right, #fff 0%, #fff5f5 100%);
                }

                .notification-item.warning {
                    border-color: #ffa502;
                    background: linear-gradient(to right, #fff 0%, #fffbf5 100%);
                }

                .notification-item.info {
                    border-color: #00bcd4;
                    background: linear-gradient(to right, #fff 0%, #f0fcff 100%);
                }

                .notification-top {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }

                .notification-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .notification-item.urgent .notification-icon {
                    background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
                }

                .notification-item.warning .notification-icon {
                    background: linear-gradient(135deg, #ffa502 0%, #ff8c00 100%);
                }

                .notification-item.info .notification-icon {
                    background: linear-gradient(135deg, #00bcd4 0%, #00a8c9 100%);
                }

                .notification-details {
                    flex: 1;
                }

                .pet-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 4px;
                }

                .vaccine-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: #495057;
                    margin-bottom: 8px;
                }

                .notification-message {
                    font-size: 14px;
                    color: #6c757d;
                    line-height: 1.5;
                    margin-bottom: 8px;
                }

                .notification-date {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #868e96;
                    background: #f8f9fa;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-weight: 500;
                }

                .empty-notifications {
                    text-align: center;
                    padding: 60px 20px;
                    color: #adb5bd;
                }

                .empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .empty-text {
                    font-size: 16px;
                    font-weight: 500;
                }

                .notification-footer {
                    padding: 16px 24px;
                    border-top: 1px solid #e9ecef;
                    background: #f8f9fa;
                    text-align: center;
                }

                .view-all-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .view-all-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #adb5bd;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    margin: 0 auto 16px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .notification-content {
                        max-height: 90vh;
                        border-radius: 20px 20px 0 0;
                    }

                    .notification-header {
                        padding: 20px;
                    }

                    .notification-header h2 {
                        font-size: 18px;
                    }

                    .notification-body {
                        padding: 16px;
                    }

                    .notification-item {
                        padding: 16px;
                    }

                    .pet-name {
                        font-size: 16px;
                    }

                    .vaccine-name {
                        font-size: 14px;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Setup notification button click handler
    function setupNotificationButton() {
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            // Remove existing onclick if any
            notificationBtn.onclick = null;
            
            // Add new click handler
            notificationBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleModal();
            });
            
            // notification button handler attached
        } else {
            console.warn('⚠️ Notification button not found');
        }
    }

    // Toggle modal
    function toggleModal() {
        // toggling notification modal
        const modal = document.getElementById('notificationModal');
        if (!modal) return;

        modal.classList.toggle('active');
        
        if (modal.classList.contains('active')) {
            loadNotifications();
        }
    }

    // Close modal on backdrop click
    function closeModalOnBackdrop(event) {
        if (event.target.id === 'notificationModal') {
            toggleModal();
        }
    }

    // Load notifications
    async function loadNotifications() {
        // loading notifications
        const token = localStorage.getItem('token');
        if (!token) {
            updateBadge(0);
            return;
        }

        try {
            // Get user's pets
            const petsResponse = await fetch(`${API_URL}/pets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!petsResponse.ok) {
                updateBadge(0);
                return;
            }
            
            const pets = await petsResponse.json();
            // pets loaded

            if (!pets || pets.length === 0) {
                displayEmptyState();
                return;
            }

            // Get vaccine schedules
            const schedulesResponse = await fetch(`${API_URL}/vaccine-schedules`);
            const schedules = await schedulesResponse.json();

            let allNotifications = [];

            // Process each pet
            for (const pet of pets) {
                const historyResponse = await fetch(`${API_URL}/pets/${pet.id}/vaccination-history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!historyResponse.ok) continue;
                const vaccinations = await historyResponse.json();

                // Check overdue/due soon vaccines
                for (const vaccination of vaccinations) {
                    if (vaccination.next_due_date) {
                        const daysLeft = daysUntil(vaccination.next_due_date);
                        
                        if (daysLeft < 0) {
                            allNotifications.push({
                                type: 'urgent',
                                petName: pet.name,
                                petId: pet.id,
                                vaccineName: vaccination.vaccine_name,
                                message: `วัคซีนเลยกำหนดฉีดแล้ว ${Math.abs(daysLeft)} วัน`,
                                dueDate: vaccination.next_due_date,
                                daysLeft: daysLeft,
                                icon: '⚠️'
                            });
                        } else if (daysLeft <= 30) {
                            allNotifications.push({
                                type: 'warning',
                                petName: pet.name,
                                petId: pet.id,
                                vaccineName: vaccination.vaccine_name,
                                message: `ใกล้ถึงกำหนดฉีดวัคซีนในอีก ${daysLeft} วัน`,
                                dueDate: vaccination.next_due_date,
                                daysLeft: daysLeft,
                                icon: '⏰'
                            });
                        }
                    }
                }

                // Check recommended vaccines by age
                if (pet.birth_date) {
                    const ageInWeeks = calculateAgeInWeeks(pet.birth_date);
                    
                    for (const schedule of schedules) {
                        if (ageInWeeks >= schedule.age_weeks_min && 
                            (!schedule.age_weeks_max || ageInWeeks <= schedule.age_weeks_max)) {
                            
                            const hasVaccine = vaccinations.some(v => 
                                v.vaccine_name === schedule.vaccine_name
                            );

                            if (!hasVaccine) {
                                allNotifications.push({
                                    type: 'info',
                                    petName: pet.name,
                                    petId: pet.id,
                                    vaccineName: schedule.vaccine_name,
                                    message: `แนะนำให้ฉีดวัคซีนตามอายุ (${ageInWeeks} สัปดาห์)`,
                                    dueDate: null,
                                    daysLeft: 0,
                                    icon: '💉'
                                });
                            }
                        }
                    }
                }
            }

            // Sort notifications by urgency
            allNotifications.sort((a, b) => {
                const urgencyOrder = { 'urgent': 0, 'warning': 1, 'info': 2 };
                if (urgencyOrder[a.type] !== urgencyOrder[b.type]) {
                    return urgencyOrder[a.type] - urgencyOrder[b.type];
                }
                return a.daysLeft - b.daysLeft;
            });

            // total notifications computed
            currentNotifications = allNotifications;
            displayNotifications(allNotifications);
            updateBadge(allNotifications.length);

        } catch (error) {
            console.error('❌ Error loading notifications:', error);
            updateBadge(0);
        }
    }

    // Display notifications
    function displayNotifications(notifications) {
        const container = document.getElementById('notificationList');
        if (!container) return;

        if (notifications.length === 0) {
            displayEmptyState();
            return;
        }

        container.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.type}" onclick="window.location.href='pet-details.html?id=${notif.petId}'">
                <div class="notification-top">
                    <div class="notification-icon">${notif.icon}</div>
                    <div class="notification-details">
                        <div class="pet-name">${notif.petName}</div>
                        <div class="vaccine-name">${notif.vaccineName}</div>
                        <div class="notification-message">${notif.message}</div>
                        ${notif.dueDate ? `
                            <span class="notification-date">
                                📅 กำหนดฉีด: ${formatThaiDate(notif.dueDate)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Display empty state
    function displayEmptyState() {
        const container = document.getElementById('notificationList');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-notifications">
                <div class="empty-icon">✨</div>
                <div class="empty-text">ไม่มีการแจ้งเตือนในขณะนี้</div>
            </div>
        `;
        updateBadge(0);
    }

    // Update badge
    function updateBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Helper functions
    function calculateAgeInWeeks(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        const diffTime = Math.abs(today - birth);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 7);
    }

    function daysUntil(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    function formatThaiDate(dateString) {
        const date = new Date(dateString);
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                          'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
    }

    // Export public API
    window.NotificationSystem = {
        init: initNotificationSystem,
        toggleModal: toggleModal,
        closeModalOnBackdrop: closeModalOnBackdrop,
        loadNotifications: loadNotifications
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationSystem);
    } else {
        initNotificationSystem();
    }

    // ========== NOTIFICATION SYSTEM ==========
function initNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('notificationModal');

    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleNotificationModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleNotificationModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target.id === 'notificationModal') {
                toggleNotificationModal();
            }
        });
    }

    const token = localStorage.getItem('token');
    if (token) {
        loadNotifications();
    }
}

function toggleNotificationModal() {
    const modal = document.getElementById('notificationModal');
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
        loadNotifications();
    }
}

async function loadNotifications() {
    const API_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const petsResponse = await fetch(`${API_URL}/pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!petsResponse.ok) {
            updateNotificationBadge(0);
            return;
        }
        
        const pets = await petsResponse.json();

        if (!pets || pets.length === 0) {
            displayEmptyNotifications();
            return;
        }

        const schedulesResponse = await fetch(`${API_URL}/vaccine-schedules`);
        const schedules = await schedulesResponse.json();

        let allNotifications = [];

        for (const pet of pets) {
            const historyResponse = await fetch(`${API_URL}/pets/${pet.id}/vaccination-history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!historyResponse.ok) continue;
            const vaccinations = await historyResponse.json();

            for (const vaccination of vaccinations) {
                if (vaccination.next_due_date) {
                    const daysLeft = daysUntilDate(vaccination.next_due_date);
                    
                    if (daysLeft < 0) {
                        allNotifications.push({
                            type: 'urgent',
                            petName: pet.name,
                            petId: pet.id,
                            vaccineName: vaccination.vaccine_name,
                            message: `วัคซีนเลยกำหนดฉีดแล้ว ${Math.abs(daysLeft)} วัน`,
                            dueDate: vaccination.next_due_date,
                            icon: '⚠️'
                        });
                    } else if (daysLeft <= 30) {
                        allNotifications.push({
                            type: 'warning',
                            petName: pet.name,
                            petId: pet.id,
                            vaccineName: vaccination.vaccine_name,
                            message: `ใกล้ถึงกำหนดฉีดวัคซีนในอีก ${daysLeft} วัน`,
                            dueDate: vaccination.next_due_date,
                            icon: '⏰'
                        });
                    }
                }
            }

            if (pet.birth_date) {
                const ageInWeeks = calculatePetAgeInWeeks(pet.birth_date);
                
                for (const schedule of schedules) {
                    if (ageInWeeks >= schedule.age_weeks_min && 
                        (!schedule.age_weeks_max || ageInWeeks <= schedule.age_weeks_max)) {
                        
                        const hasVaccine = vaccinations.some(v => 
                            v.vaccine_name === schedule.vaccine_name
                        );

                        if (!hasVaccine) {
                            allNotifications.push({
                                type: 'info',
                                petName: pet.name,
                                petId: pet.id,
                                vaccineName: schedule.vaccine_name,
                                message: `แนะนำให้ฉีดวัคซีนตามอายุ (${ageInWeeks} สัปดาห์)`,
                                icon: '💉'
                            });
                        }
                    }
                }
            }
        }

        allNotifications.sort((a, b) => {
            const order = { 'urgent': 0, 'warning': 1, 'info': 2 };
            return order[a.type] - order[b.type];
        });

        displayNotificationsList(allNotifications);
        updateNotificationBadge(allNotifications.length);

    } catch (error) {
        console.error('Error:', error);
        updateNotificationBadge(0);
    }
}

function displayNotificationsList(notifications) {
    const container = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
        displayEmptyNotifications();
        return;
    }

    container.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.type}" onclick="window.location.href='pet-details.html?id=${n.petId}'">
            <div class="notification-top">
                <div class="notification-icon">${n.icon}</div>
                <div class="notification-details">
                    <div class="pet-name">${n.petName}</div>
                    <div class="vaccine-name">${n.vaccineName}</div>
                    <div class="notification-message">${n.message}</div>
                    ${n.dueDate ? `<span class="notification-date">📅 ${formatThaiDateString(n.dueDate)}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function displayEmptyNotifications() {
    document.getElementById('notificationList').innerHTML = `
        <div class="empty-notifications">
            <div class="empty-icon">✨</div>
            <div>ไม่มีการแจ้งเตือนในขณะนี้</div>
        </div>
    `;
    updateNotificationBadge(0);
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

function calculatePetAgeInWeeks(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    const diffDays = Math.ceil((today - birth) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

function daysUntilDate(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function formatThaiDateString(dateString) {
    const date = new Date(dateString);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

// เรียกใช้เมื่อหน้าโหลด
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}

})();