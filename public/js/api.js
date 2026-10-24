// ============================================================
// ReserveEase - API Communication Module
// Centralized Fetch API wrapper for all backend calls
// ============================================================

const API = {
    baseUrl: '/api',

    // Generic fetch wrapper
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith(this.baseUrl) 
            ? endpoint 
            : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'same-origin',
            ...options
        };

        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (response.status === 401) {
                // Session expired
                if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
                    showToast('Session expired. Please log in again.', 'warning');
                    setTimeout(() => window.location.href = '/login.html', 1500);
                }
            }

            return { 
                ok: response.ok, 
                status: response.status, 
                data,
                ...(typeof data === 'object' && data !== null ? data : {})
            };
        } catch (error) {
            console.error('API Error:', error);
            return {
                ok: false,
                status: 0,
                data: { success: false, message: 'Network error. Please check your connection.' },
                success: false,
                message: 'Network error. Please check your connection.'
            };
        }
    },

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    // POST request
    async post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    },

    // PUT request
    async put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    },

    // PATCH request
    async patch(endpoint, body) {
        return this.request(endpoint, { method: 'PATCH', body });
    },

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// ============================================================
// Toast Notification System
// ============================================================
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.classList.add('toast-out'); setTimeout(() => this.parentElement.remove(), 300);">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ============================================================
// Confirmation Dialog
// ============================================================
function confirmModal(title, message, confirmBtnText = 'Confirm', type = 'primary') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active confirm-dialog';
        overlay.style.zIndex = '9999';
        
        let iconClass = 'fa-circle-question';
        let iconColor = 'var(--primary-600)';
        let iconBg = 'var(--primary-50)';
        let btnClass = type;
        
        const titleLower = String(title).toLowerCase();
        if (type === 'danger' || titleLower.includes('cancel') || titleLower.includes('delete') || titleLower.includes('deactivate')) {
            iconClass = 'fa-triangle-exclamation';
            iconColor = 'var(--danger-600)';
            iconBg = 'var(--danger-50)';
            btnClass = 'danger';
        } else if (type === 'success' || titleLower.includes('confirm') || titleLower.includes('approve') || titleLower.includes('activate')) {
            iconClass = 'fa-circle-check';
            iconColor = 'var(--success-600)';
            iconBg = 'var(--success-50)';
            btnClass = 'success';
        }

        overlay.innerHTML = `
            <div class="modal" style="max-width: 440px; margin: auto; animation: modalIn 0.2s ease; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);">
                <div class="modal-body" style="padding: 24px 24px 16px; text-align: center;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; background: ${iconBg}; color: ${iconColor};">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--gray-900); margin-bottom: 8px;">${title}</h3>
                    <p style="font-size: 0.9rem; color: var(--gray-600); margin: 0; line-height: 1.5;">${message || ''}</p>
                </div>
                <div class="modal-footer" style="display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid var(--gray-100); background: var(--gray-50);">
                    <button type="button" class="btn btn-secondary cancel-btn" style="flex: 1;">Cancel</button>
                    <button type="button" class="btn btn-${btnClass} confirm-btn" style="flex: 1;">${confirmBtnText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        function handleClose(result) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
            resolve(result);
        }

        overlay.querySelector('.cancel-btn').onclick = () => handleClose(false);
        overlay.querySelector('.confirm-btn').onclick = () => handleClose(true);
        overlay.onclick = (e) => {
            if (e.target === overlay) handleClose(false);
        };
    });
}

function showConfirm(title, message, onConfirm, type = 'danger') {
    confirmModal(title, message, 'Confirm', type).then(confirmed => {
        if (confirmed && onConfirm) onConfirm();
    });
}

// ============================================================
// Modal Helpers
// ============================================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('active')) {
        if (e.target.classList.contains('modal-overlay') || (e.target.classList.contains('modal') && !e.target.closest('.modal-content') && !e.target.closest('.confirm-dialog .modal'))) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// ============================================================
// Loading Helper
// ============================================================
function showLoading(element) {
    if (element) {
        element.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        `;
    }
}

function showEmpty(element, icon, title, description, actionHtml = '') {
    if (element) {
        element.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid ${icon}"></i>
                <h3>${title}</h3>
                <p>${description}</p>
                ${actionHtml}
            </div>
        `;
    }
}

// ============================================================
// Utility Functions
// ============================================================
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
}

function getStatusBadge(status) {
    const classes = {
        'Pending': 'badge-pending',
        'Confirmed': 'badge-confirmed',
        'Completed': 'badge-completed',
        'Cancelled': 'badge-cancelled',
        'Paid': 'badge-paid',
        'Failed': 'badge-cancelled',
        'Refunded': 'badge-refunded'
    };
    return `<span class="badge ${classes[status] || 'badge-pending'}">${status}</span>`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Get user initials for avatar
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
