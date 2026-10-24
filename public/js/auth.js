// ============================================================
// ReserveEase - Auth Module
// Handles login, register, session management
// ============================================================

// Check auth state and redirect appropriately
async function checkAuth(requiredRole = null) {
    const res = await API.get('/auth/me');
    
    if (!res.ok || !res.data.success) {
        // Not logged in
        const publicPages = ['index.html', 'login.html', 'register.html', ''];
        const currentPage = window.location.pathname.split('/').pop();
        if (!publicPages.includes(currentPage)) {
            window.location.href = '/login.html';
        }
        return null;
    }

    const user = res.data.user;

    // Check role and port
    const currentPort = window.location.port;
    if (user.role === 'admin' && currentPort === '3030' && requiredRole === 'customer') {
        window.location.href = `http://${window.location.hostname}:3000/admin/dashboard.html`;
        return null;
    }
    if (user.role === 'customer' && currentPort === '3000' && requiredRole === 'admin') {
        window.location.href = `http://${window.location.hostname}:3030/customer-dashboard.html`;
        return null;
    }

    if (requiredRole && user.role !== requiredRole) {
        if (user.role === 'admin') {
            window.location.href = `http://${window.location.hostname}:3000/admin/dashboard.html`;
        } else {
            window.location.href = `http://${window.location.hostname}:3030/customer-dashboard.html`;
        }
        return null;
    }

    // Update UI with user info
    updateUserUI(user);
    return user;
}

// Update sidebar user info
function updateUserUI(user) {
    const nameEl = document.querySelector('.sidebar-user-info .name');
    const roleEl = document.querySelector('.sidebar-user-info .role');
    const avatarEl = document.querySelector('.sidebar-user .avatar');

    if (nameEl) nameEl.textContent = user.fullName;
    if (roleEl) roleEl.textContent = user.role;
    if (avatarEl) avatarEl.textContent = getInitials(user.fullName);
}

// Logout
async function logout() {
    const res = await API.post('/auth/logout');
    showToast('Logged out successfully', 'success');
    setTimeout(() => window.location.href = '/login.html', 500);
}

// Setup sidebar toggle
function setupSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const mobileOverlay = document.querySelector('.mobile-overlay');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                sidebar.classList.toggle('mobile-open');
                if (mobileOverlay) mobileOverlay.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
        });
    }

    // Set active nav link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.endsWith(href.replace('./', ''))) {
            link.classList.add('active');
        }
    });
}

// Initialize auth page (login/register)
function initAuthPage() {
    // If already logged in, redirect to respective port portal
    API.get('/auth/me').then(res => {
        if (res.ok && res.data.success) {
            const user = res.data.user;
            if (user.role === 'admin') {
                window.location.href = `http://${window.location.hostname}:3000/admin/dashboard.html`;
            } else {
                window.location.href = `http://${window.location.hostname}:3030/customer-dashboard.html`;
            }
        }
    });
}
