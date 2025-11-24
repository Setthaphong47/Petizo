// Profile Dropdown Component
// ไฟล์นี้ใช้สำหรับจัดการ Profile Dropdown ในทุกหน้า

// Initialize profile dropdown
function initProfileDropdown() {
    // Prevent double-initialization when the script is included more than once.
    if (window.__petizo_profileDropdownInitialized) return true;

    const profileBtn = document.getElementById('profileBtn');
    const dropdown = document.getElementById('profileDropdown');

    // If navbar hasn't rendered yet, signal failure so caller may retry/observe
    if (!profileBtn || !dropdown) return false;

    // Mark as initialized only after successful element detection
    window.__petizo_profileDropdownInitialized = true;
    console.debug('[profile-dropdown] initProfileDropdown: elements found, initializing');
    
    // Toggle dropdown on button click
    profileBtn.addEventListener('click', function(e) {
        console.debug('[profile-dropdown] profileBtn clicked');
        e.stopPropagation();
        dropdown.classList.toggle('show');
        console.debug('[profile-dropdown] dropdown classList now:', dropdown.classList.toString());
    });
    
    // Handle dropdown items click
    const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // ถ้าเป็น link (<a>) ให้ปิด dropdown แล้วไปยัง link
            if (this.tagName === 'A') {
                dropdown.classList.remove('show');
                return; // ให้ browser จัดการ navigation
            }
            
            // ถ้าเป็น button (logout) ให้ stop propagation และปิด dropdown
            e.stopPropagation();
            dropdown.classList.remove('show');
            
            // เรียกฟังก์ชัน logout ถ้ามี
            if (this.classList.contains('logout') && typeof window.logout === 'function') {
                console.debug('[profile-dropdown] logout item clicked');
                window.logout();
            }
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
            if (dropdown.classList.contains('show')) console.debug('[profile-dropdown] clicking outside — closing dropdown');
            dropdown.classList.remove('show');
        }
    });
    
    // Close dropdown on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            dropdown.classList.remove('show');
        }
    });
}

// Initialize when DOM is ready
function ensureProfileDropdownInit() {
    // Try immediate init
    const ok = initProfileDropdown();
    if (ok) return;

    // If not initialized yet, observe DOM for insertion of navbar/profile elements
    const observer = new MutationObserver((mutations, obs) => {
        if (document.getElementById('profileBtn') && document.getElementById('profileDropdown')) {
            initProfileDropdown();
            obs.disconnect();
        }
    });

    observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureProfileDropdownInit);
} else {
    ensureProfileDropdownInit();
}