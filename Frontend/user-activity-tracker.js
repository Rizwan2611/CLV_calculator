// User Activity Tracker
// Comprehensive tracking system for user interactions and dataset updates

class UserActivityTracker {
    constructor() {
        this.isInitialized = false;
        this.sessionStartTime = Date.now();
        this.activityQueue = [];
        this.syncInterval = null;
        this.pageViews = [];
        this.interactions = [];
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Wait for Firebase to be ready
            if (window.firebaseAuth) {
                await window.firebaseAuth.waitForAuth();
            }
            
            this.setupEventListeners();
            this.startPeriodicSync();
            this.trackPageView();
            
            this.isInitialized = true;
            console.log('User Activity Tracker initialized');
        } catch (error) {
            console.error('Error initializing User Activity Tracker:', error);
        }
    }

    setupEventListeners() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackActivity('page_hidden');
            } else {
                this.trackActivity('page_visible');
            }
        });

        // Track clicks on important elements
        document.addEventListener('click', (e) => {
            this.trackClick(e);
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.trackFormSubmission(e);
        });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // Track scroll behavior
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.trackActivity('scroll', {
                    scrollY: window.scrollY,
                    scrollPercent: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
                });
            }, 1000);
        });
    }

    trackPageView() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            referrer: document.referrer,
            userAgent: navigator.userAgent
        };

        this.pageViews.push(pageData);
        this.trackActivity('page_view', pageData);
    }

    trackClick(event) {
        const element = event.target;
        const clickData = {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            text: element.textContent?.substring(0, 100),
            href: element.href,
            timestamp: new Date().toISOString()
        };

        // Track important clicks
        if (element.matches('button, a, .btn, [role="button"]')) {
            this.trackActivity('click', clickData);
        }
    }

    trackFormSubmission(event) {
        const form = event.target;
        const formData = {
            formId: form.id,
            formClass: form.className,
            action: form.action,
            method: form.method,
            timestamp: new Date().toISOString()
        };

        this.trackActivity('form_submit', formData);
    }

    trackActivity(activityType, data = {}) {
        const activity = {
            type: activityType,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            url: window.location.href,
            data: data
        };

        this.activityQueue.push(activity);
        
        // Auto-sync if queue gets too large
        if (this.activityQueue.length >= 10) {
            this.syncActivities();
        }
    }

    async syncActivities() {
        if (this.activityQueue.length === 0) return;

        try {
            if (window.firebaseAuth && window.firebaseAuth.isAuthenticated()) {
                const user = window.firebaseAuth.getCurrentUser();
                if (user) {
                    // Batch sync activities to Firebase
                    await this.syncToFirebase(user, [...this.activityQueue]);
                    
                    // Update dataset based on activities
                    await this.updateDatasetFromActivities(user, [...this.activityQueue]);
                    
                    this.activityQueue = []; // Clear queue after successful sync
                }
            }
        } catch (error) {
            console.error('Error syncing activities:', error);
        }
    }

    async syncToFirebase(user, activities) {
        try {
            if (!window.firebaseAuth) return;

            const batchData = {
                userId: user.uid,
                sessionId: this.getSessionId(),
                activities: activities,
                sessionDuration: Date.now() - this.sessionStartTime,
                timestamp: new Date().toISOString()
            };

            // Store in Firebase
            const { db } = await import('./firebase-config.js');
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const activityBatchRef = doc(db, 'activityBatches', `${user.uid}_${Date.now()}`);
            await setDoc(activityBatchRef, batchData);

        } catch (error) {
            console.error('Error syncing to Firebase:', error);
        }
    }

    async updateDatasetFromActivities(user, activities) {
        try {
            // Analyze activities to generate customer insights
            const insights = this.analyzeActivities(activities);
            
            // Generate updated customer data
            const customerData = await this.generateCustomerDataFromInsights(user, insights);
            
            // Update Firebase dataset
            if (window.firebaseAuth) {
                await window.firebaseAuth.updateGlobalDataset(user, 'activity_update');
            }
            
            // Sync with backend
            if (window.CLVApi && customerData) {
                await window.CLVApi.updateCustomerFromUserActivity(customerData);
            }

        } catch (error) {
            console.error('Error updating dataset from activities:', error);
        }
    }

    analyzeActivities(activities) {
        const insights = {
            totalActivities: activities.length,
            activityTypes: {},
            engagementScore: 0,
            sessionDuration: Date.now() - this.sessionStartTime,
            pageViews: activities.filter(a => a.type === 'page_view').length,
            clicks: activities.filter(a => a.type === 'click').length,
            formSubmissions: activities.filter(a => a.type === 'form_submit').length
        };

        // Count activity types
        activities.forEach(activity => {
            insights.activityTypes[activity.type] = (insights.activityTypes[activity.type] || 0) + 1;
        });

        // Calculate engagement score (0-100)
        insights.engagementScore = Math.min(100, 
            (insights.clicks * 5) + 
            (insights.formSubmissions * 15) + 
            (insights.pageViews * 3) + 
            Math.floor(insights.sessionDuration / 60000) // 1 point per minute
        );

        return insights;
    }

    async generateCustomerDataFromInsights(user, insights) {
        try {
            // Base values
            let averagePurchaseValue = 150;
            let purchaseFrequency = 8;
            let customerLifespan = 2;

            // Adjust based on engagement
            const engagementMultiplier = insights.engagementScore / 100;
            
            averagePurchaseValue = Math.floor(averagePurchaseValue * (1 + engagementMultiplier * 0.5));
            purchaseFrequency = Math.floor(purchaseFrequency * (1 + engagementMultiplier * 0.3));
            customerLifespan = Math.floor(customerLifespan * (1 + engagementMultiplier * 0.2));

            // Adjust based on specific activities
            if (insights.formSubmissions > 0) {
                averagePurchaseValue += 50; // Form submissions indicate higher intent
            }

            if (insights.sessionDuration > 300000) { // 5+ minutes
                customerLifespan += 1; // Longer sessions indicate higher retention
            }

            const clv = averagePurchaseValue * purchaseFrequency * customerLifespan;

            return {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                averagePurchaseValue,
                purchaseFrequency,
                customerLifespan,
                clv,
                engagementScore: insights.engagementScore,
                sessionDuration: insights.sessionDuration,
                totalActivities: insights.totalActivities,
                lastUpdated: new Date().toISOString(),
                source: 'activity_tracking'
            };

        } catch (error) {
            console.error('Error generating customer data from insights:', error);
            return null;
        }
    }

    startPeriodicSync() {
        // Sync activities every 30 seconds
        this.syncInterval = setInterval(() => {
            this.syncActivities();
        }, 30000);
    }

    trackSessionEnd() {
        const sessionData = {
            sessionDuration: Date.now() - this.sessionStartTime,
            totalPageViews: this.pageViews.length,
            totalInteractions: this.interactions.length,
            endTime: new Date().toISOString()
        };

        this.trackActivity('session_end', sessionData);
        this.syncActivities(); // Final sync before leaving
    }

    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }

    // Public methods for manual tracking
    trackCustomEvent(eventName, eventData = {}) {
        this.trackActivity('custom_event', {
            eventName,
            ...eventData
        });
    }

    trackPurchase(purchaseData) {
        this.trackActivity('purchase', purchaseData);
    }

    trackCalculatorUsage(calculatorData) {
        this.trackActivity('calculator_usage', calculatorData);
    }

    // Get current session statistics
    getSessionStats() {
        return {
            sessionId: this.getSessionId(),
            sessionDuration: Date.now() - this.sessionStartTime,
            totalActivities: this.activityQueue.length,
            pageViews: this.pageViews.length,
            isActive: !document.hidden
        };
    }

    // Cleanup method
    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.trackSessionEnd();
    }
}

// Initialize global tracker
window.UserActivityTracker = new UserActivityTracker();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserActivityTracker;
}
