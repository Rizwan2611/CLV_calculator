// Authentication Data Logger
// Captures and stores live signup/login data to JSON files

class AuthDataLogger {
    constructor() {
        this.isInitialized = false;
        this.authQueue = [];
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Authentication Data Logger...');
            
            // Wait for Firebase to be ready
            if (window.firebaseAuth) {
                await window.firebaseAuth.waitForAuth();
            }
            
            // Hook into Firebase authentication events
            this.setupAuthHooks();
            
            this.isInitialized = true;
            console.log('Authentication Data Logger initialized successfully');
        } catch (error) {
            console.error('Error initializing Auth Data Logger:', error);
        }
    }

    setupAuthHooks() {
        if (!window.firebaseAuth) return;

        // Override the original handleAuthStateChange method
        const originalHandleAuthStateChange = window.firebaseAuth.handleAuthStateChange.bind(window.firebaseAuth);
        
        window.firebaseAuth.handleAuthStateChange = (user) => {
            // Call original method
            originalHandleAuthStateChange(user);
            
            // Log authentication event
            if (user) {
                this.logAuthEvent(user, 'login');
            }
        };

        // Override signUp method
        const originalSignUp = window.firebaseAuth.signUp.bind(window.firebaseAuth);
        window.firebaseAuth.signUp = async (email, password, displayName) => {
            const result = await originalSignUp(email, password, displayName);
            
            if (result.success) {
                this.logAuthEvent(result.user, 'signup');
            }
            
            return result;
        };

        // Override signIn method
        const originalSignIn = window.firebaseAuth.signIn.bind(window.firebaseAuth);
        window.firebaseAuth.signIn = async (email, password) => {
            const result = await originalSignIn(email, password);
            
            if (result.success) {
                this.logAuthEvent(result.user, 'login');
            }
            
            return result;
        };

        // Override Google sign-in method
        const originalGoogleSignIn = window.firebaseAuth.signInWithGoogle.bind(window.firebaseAuth);
        window.firebaseAuth.signInWithGoogle = async () => {
            const result = await originalGoogleSignIn();
            
            if (result.success) {
                this.logAuthEvent(result.user, result.user.metadata?.creationTime === result.user.metadata?.lastSignInTime ? 'signup' : 'login');
            }
            
            return result;
        };
    }

    async logAuthEvent(user, eventType) {
        try {
            const authData = this.createAuthDataEntry(user, eventType);
            
            // Add to queue for processing
            this.authQueue.push(authData);
            
            // Send to backend immediately
            await this.sendAuthDataToBackend(authData);
            
            // Also store locally as backup
            this.storeAuthDataLocally(authData);
            
            console.log(`${eventType.toUpperCase()} event logged:`, authData);
            
        } catch (error) {
            console.error('Error logging auth event:', error);
        }
    }

    createAuthDataEntry(user, eventType) {
        const timestamp = new Date().toISOString();
        const sessionId = this.generateSessionId();
        
        return {
            // User Information
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            
            // Authentication Details
            eventType: eventType, // 'login' or 'signup'
            provider: this.detectAuthProvider(user),
            timestamp: timestamp,
            sessionId: sessionId,
            
            // User Metadata
            creationTime: user.metadata?.creationTime || timestamp,
            lastSignInTime: user.metadata?.lastSignInTime || timestamp,
            isNewUser: eventType === 'signup',
            
            // Device & Browser Information
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            deviceType: this.getDeviceType(),
            browserInfo: this.getBrowserInfo(),
            
            // Location Information (if available)
            ipAddress: null, // Will be filled by backend
            location: null,   // Will be filled by backend
            
            // Session Information
            referrer: document.referrer,
            currentUrl: window.location.href,
            pageTitle: document.title,
            
            // Additional Metadata
            isOnline: navigator.onLine,
            connectionType: this.getConnectionType(),
            
            // Tracking IDs
            firebaseUID: user.uid,
            customerId: user.uid, // For CLV tracking
            
            // Timestamps for different formats
            timestampUnix: Date.now(),
            timestampLocal: new Date().toLocaleString(),
            
            // Event Source
            source: 'web_app',
            version: '1.0.0'
        };
    }

    async sendAuthDataToBackend(authData) {
        try {
            // Send to your backend API
            const response = await fetch('http://localhost:8080/api/log-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(authData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Auth data sent to backend successfully:', result);
            
        } catch (error) {
            console.error('Error sending auth data to backend:', error);
            
            // Retry mechanism
            setTimeout(() => {
                this.retryAuthDataSend(authData, 1);
            }, this.retryDelay);
        }
    }

    async retryAuthDataSend(authData, attempt) {
        if (attempt > this.maxRetries) {
            console.error('Max retry attempts reached for auth data:', authData);
            return;
        }

        try {
            await this.sendAuthDataToBackend(authData);
        } catch (error) {
            console.log(`Retry attempt ${attempt} failed, trying again...`);
            setTimeout(() => {
                this.retryAuthDataSend(authData, attempt + 1);
            }, this.retryDelay * attempt);
        }
    }

    storeAuthDataLocally(authData) {
        try {
            // Get existing auth logs from localStorage
            const existingLogs = JSON.parse(localStorage.getItem('authLogs') || '[]');
            
            // Add new log entry
            existingLogs.push(authData);
            
            // Keep only last 100 entries to prevent storage overflow
            if (existingLogs.length > 100) {
                existingLogs.splice(0, existingLogs.length - 100);
            }
            
            // Save back to localStorage
            localStorage.setItem('authLogs', JSON.stringify(existingLogs));
            
        } catch (error) {
            console.error('Error storing auth data locally:', error);
        }
    }

    detectAuthProvider(user) {
        if (user.providerData && user.providerData.length > 0) {
            const providerId = user.providerData[0].providerId;
            switch (providerId) {
                case 'google.com':
                    return 'google';
                case 'password':
                    return 'email';
                default:
                    return providerId;
            }
        }
        return 'unknown';
    }

    getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Mobile|Android|iPhone/.test(userAgent)) {
            return 'mobile';
        } else if (/Tablet|iPad/.test(userAgent)) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browser = 'unknown';
        let version = 'unknown';
        
        if (userAgent.includes('Chrome')) {
            browser = 'chrome';
            version = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown';
        } else if (userAgent.includes('Firefox')) {
            browser = 'firefox';
            version = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'unknown';
        } else if (userAgent.includes('Safari')) {
            browser = 'safari';
            version = userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'unknown';
        } else if (userAgent.includes('Edge')) {
            browser = 'edge';
            version = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || 'unknown';
        }
        
        return {
            name: browser,
            version: version,
            fullUserAgent: userAgent
        };
    }

    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }

    generateSessionId() {
        return 'auth_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Public methods for accessing logged data
    getLocalAuthLogs() {
        try {
            return JSON.parse(localStorage.getItem('authLogs') || '[]');
        } catch (error) {
            console.error('Error getting local auth logs:', error);
            return [];
        }
    }

    getAuthLogsByType(eventType) {
        const logs = this.getLocalAuthLogs();
        return logs.filter(log => log.eventType === eventType);
    }

    getAuthLogsByDateRange(startDate, endDate) {
        const logs = this.getLocalAuthLogs();
        return logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });
    }

    clearLocalAuthLogs() {
        localStorage.removeItem('authLogs');
        console.log('Local auth logs cleared');
    }

    // Export auth logs as JSON
    exportAuthLogs() {
        const logs = this.getLocalAuthLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `auth_logs_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Get statistics
    getAuthStatistics() {
        const logs = this.getLocalAuthLogs();
        const stats = {
            totalEvents: logs.length,
            signups: logs.filter(log => log.eventType === 'signup').length,
            logins: logs.filter(log => log.eventType === 'login').length,
            googleAuth: logs.filter(log => log.provider === 'google').length,
            emailAuth: logs.filter(log => log.provider === 'email').length,
            mobileUsers: logs.filter(log => log.deviceType === 'mobile').length,
            desktopUsers: logs.filter(log => log.deviceType === 'desktop').length,
            uniqueUsers: new Set(logs.map(log => log.userId)).size
        };
        
        return stats;
    }
}

// Initialize global auth data logger
window.AuthDataLogger = new AuthDataLogger();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthDataLogger;
}
