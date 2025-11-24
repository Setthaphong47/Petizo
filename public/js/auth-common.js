// /js/auth-common.js
// Function ที่ใช้ร่วมกันในทุกหน้า

/**
 * ตรวจสอบสถานะการล็อกอินและแสดงชื่อผู้ใช้
 * ใช้ได้ในทุกหน้าที่มี navbar
 */
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Elements ที่ต้องการ
    const navActionsGuest = document.getElementById('navActionsGuest');
    const navActionsUser = document.getElementById('navActionsUser');
    const userDisplayName = document.getElementById('userDisplayName');
    
    if (token && user) {
        // ผู้ใช้ล็อกอินแล้ว
        if (navActionsGuest) navActionsGuest.classList.add('hidden');
        if (navActionsUser) navActionsUser.classList.remove('hidden');
        
        // แสดงชื่อผู้ใช้
        if (userDisplayName) {
            try {
                const userData = JSON.parse(user);
                // ให้แสดง full_name ก่อน ถ้าไม่มีค่อยแสดง username
                userDisplayName.textContent = userData.full_name || userData.username || 'ผู้ใช้';
            } catch (e) {
                console.error('Error parsing user data:', e);
                userDisplayName.textContent = 'ผู้ใช้';
            }
        }
        
        return true; // ล็อกอินแล้ว
    } else {
        // ผู้ใช้ยังไม่ล็อกอิน
        if (navActionsGuest) navActionsGuest.classList.remove('hidden');
        if (navActionsUser) navActionsUser.classList.add('hidden');
        
        return false; // ยังไม่ล็อกอิน
    }
}

        // Logout
        function logout() {
            if (confirm('ต้องการออกจากระบบ?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            // Use the existing checkLoginStatus function (checkAuth was a missing ref)
            try {
                checkLoginStatus();
            } catch (e) {
                console.warn('checkLoginStatus failed:', e);
            }

            // Add logout button listener if present (some pages use different markup)
            const logoutBtnEl = document.getElementById('logoutBtn');
            if (logoutBtnEl) {
                logoutBtnEl.addEventListener('click', logout);
            }
        });

/**
 * ไปหน้า login
 */
function goToLogin() {
    window.location.href = 'login.html';
}

/**
 * ไปหน้า register
 */
function goToSignup() {
    window.location.href = 'register.html';
}

/**
 * ตรวจสอบว่าต้อง login ก่อนเข้าหน้านี้หรือไม่
 * เรียกใช้ในหน้าที่ต้องการให้ล็อกอินก่อน
 */
function requireLogin() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * จัดการคลิก Your Pet link
 */
function handleYourPetClick(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้า Your Pet');
        window.location.href = 'login.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Export สำหรับใช้ในหน้าอื่น
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkLoginStatus,
        logout,
        goToLogin,
        goToSignup,
        requireLogin,
        handleYourPetClick
    };
}