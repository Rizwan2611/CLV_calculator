// Professional CLV Metrics - Global Utilities
// This file provides shared functionality across all pages

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                ${icons[type] || icons.info}
                <span>${message}</span>
            </div>
        `;
        
        const colors = {
            success: 'var(--success, #4ADE80)',
            error: 'var(--error, #FF6B6B)',
            warning: '#FFA500',
            info: 'var(--accent, #00B4D8)'
        };
        
        toast.style.cssText = `
            background: var(--card, #1E1E1E);
            border: 1px solid ${colors[type]};
            border-left: 4px solid ${colors[type]};
            color: var(--text-strong, #FFFFFF);
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            min-width: 300px;
            max-width: 400px;
            pointer-events: auto;
            animation: slideInRight 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message, duration) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

// Add toast animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// LOADING SCREEN
// ============================================
const LoadingScreen = {
    show() {
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.innerHTML = `
            <div style="text-align: center;">
                <div class="loader-spinner"></div>
                <p style="margin-top: 20px; color: var(--text, #B0B0B0); font-size: 14px;">Loading...</p>
            </div>
        `;
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg, #121212);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            transition: opacity 0.3s ease;
        `;
        
        const spinnerStyle = document.createElement('style');
        spinnerStyle.textContent = `
            .loader-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid var(--border-color, #2C2C2C);
                border-top: 4px solid var(--accent, #00B4D8);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinnerStyle);
        document.body.appendChild(loader);
    },
    
    hide() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }
};

// ============================================
// SMOOTH SCROLL
// ============================================
function smoothScrollTo(element) {
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================
// FORM VALIDATION HELPERS
// ============================================
const FormValidator = {
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    validatePassword(password, minLength = 6) {
        return password.length >= minLength;
    },
    
    validateRequired(value) {
        return value && value.trim().length > 0;
    },
    
    validateNumber(value, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) return false;
        if (min !== null && num < min) return false;
        if (max !== null && num > max) return false;
        return true;
    },
    
    showError(inputElement, message) {
        inputElement.classList.add('input-error');
        let errorEl = inputElement.nextElementSibling;
        if (!errorEl || !errorEl.classList.contains('field-error')) {
            errorEl = document.createElement('span');
            errorEl.className = 'field-error';
            inputElement.parentNode.insertBefore(errorEl, inputElement.nextSibling);
        }
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    },
    
    clearError(inputElement) {
        inputElement.classList.remove('input-error');
        const errorEl = inputElement.nextElementSibling;
        if (errorEl && errorEl.classList.contains('field-error')) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }
    },
    
    clearAllErrors(formElement) {
        formElement.querySelectorAll('.input-error').forEach(el => {
            el.classList.remove('input-error');
        });
        formElement.querySelectorAll('.field-error').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
    }
};

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        localStorage.removeItem(key);
    },
    
    clear() {
        localStorage.clear();
    }
};

// NUMBER FORMATTING

const Format = {
    currency(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    },
    
    number(num, decimals = 0) {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: decimals
        }).format(num);
    },
    
    percentage(value, decimals = 1) {
        return `${(value * 100).toFixed(decimals)}%`;
    },
    
    date(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
};

// COPY TO CLIPBOARD

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        Toast.success('Copied to clipboard!');
        return true;
    } catch (err) {
        Toast.error('Failed to copy');
        return false;
    }
}

// DEBOUNCE UTILITY

function debounce(func, wait = 300) {
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

// Import router
import router, { navigateTo } from './router.js';

// Initialize page components
function initPage() {
    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 300);
    }

    // Initialize any page-specific functionality
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Example of page-specific initialization
    if (currentPage === 'data.html') {
        initDataPage();
    } else if (currentPage === 'index.html' || currentPage === '') {
        initHomePage();
    }
}

// Example page initialization functions
function initHomePage() {
    // Home page specific initialization
    console.log('Initializing home page');
}

function initDataPage() {
    // Data page specific initialization
    console.log('Initializing data page');
}

// Initialize router
router.addRoute('/', () => {
    console.log('Navigated to home');
    // Load home page content or components here
});

router.addRoute('/data.html', () => {
    console.log('Navigated to data page');
    // Load data page content or components here
});

// 404 route
router.addRoute('/404', () => {
    console.log('Page not found');
    // Handle 404 page
});

// INITIALIZE ON PAGE LOAD
document.addEventListener('DOMContentLoaded', async () => {
    initPage();
    LoadingScreen.hide();
    
    // Initialize user activity tracking
    try {
        if (window.UserActivityTracker) {
            await window.UserActivityTracker.init();
        }
    } catch (error) {
        console.error('Error initializing activity tracker:', error);
    }
    
    // Add smooth scroll to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            smoothScrollTo(target);
        });
    });
    
    // Add input validation styling
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', () => {
            FormValidator.clearError(input);
        });
    });
    
    // Track page load completion
    if (window.UserActivityTracker) {
        window.UserActivityTracker.trackCustomEvent('page_loaded', {
            loadTime: performance.now(),
            url: window.location.href
        });
    }
});

// Show loading screen on page navigation
window.addEventListener('beforeunload', () => {
    LoadingScreen.show();
});

// Export utilities globally
window.Toast = Toast;
window.LoadingScreen = LoadingScreen;
window.FormValidator = FormValidator;
window.Storage = Storage;
window.Format = Format;
window.copyToClipboard = copyToClipboard;
window.debounce = debounce;
window.smoothScrollTo = smoothScrollTo;
