// Data Synchronization Service
// Handles automatic synchronization between Firebase, backend, and local storage

class DataSyncService {
    constructor() {
        this.syncInterval = null;
        this.isRunning = false;
        this.lastSyncTime = null;
        this.syncQueue = [];
        this.retryAttempts = 0;
        this.maxRetries = 3;
        
        // Sync every 5 minutes
        this.syncIntervalMs = 5 * 60 * 1000;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Data Sync Service...');
            
            // Wait for dependencies
            await this.waitForDependencies();
            
            // Start periodic sync
            this.startPeriodicSync();
            
            // Listen for user authentication changes
            this.setupAuthListener();
            
            // Listen for online/offline events
            this.setupNetworkListener();
            
            console.log('Data Sync Service initialized successfully');
        } catch (error) {
            console.error('Error initializing Data Sync Service:', error);
        }
    }

    async waitForDependencies() {
        // Wait for Firebase Auth to be ready
        if (window.firebaseAuth) {
            await window.firebaseAuth.waitForAuth();
        }
        
        // Wait for API client to be ready
        while (!window.CLVApi) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    setupAuthListener() {
        if (window.firebaseAuth) {
            // Listen for auth state changes
            const originalHandleAuthStateChange = window.firebaseAuth.handleAuthStateChange.bind(window.firebaseAuth);
            window.firebaseAuth.handleAuthStateChange = (user) => {
                originalHandleAuthStateChange(user);
                
                if (user) {
                    // User logged in - trigger immediate sync
                    this.triggerImmediateSync();
                }
            };
        }
    }

    setupNetworkListener() {
        window.addEventListener('online', () => {
            console.log('Network connection restored - triggering sync');
            this.triggerImmediateSync();
        });

        window.addEventListener('offline', () => {
            console.log('Network connection lost - pausing sync');
            this.pauseSync();
        });
    }

    startPeriodicSync() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.syncInterval = setInterval(() => {
            this.performSync();
        }, this.syncIntervalMs);
        
        // Perform initial sync
        setTimeout(() => this.performSync(), 2000);
    }

    pauseSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isRunning = false;
    }

    resumeSync() {
        if (!this.isRunning) {
            this.startPeriodicSync();
        }
    }

    async triggerImmediateSync() {
        if (!navigator.onLine) {
            console.log('Offline - queuing sync for later');
            return;
        }
        
        await this.performSync();
    }

    async performSync() {
        if (!navigator.onLine) {
            console.log('Offline - skipping sync');
            return;
        }

        try {
            console.log('Starting data synchronization...');
            
            // Check if user is authenticated
            if (!window.firebaseAuth?.isAuthenticated()) {
                console.log('User not authenticated - skipping sync');
                return;
            }

            const user = window.firebaseAuth.getCurrentUser();
            if (!user) return;

            // Sync user data
            await this.syncUserData(user);
            
            // Sync activity data
            await this.syncActivityData(user);
            
            // Sync customer dataset
            await this.syncCustomerDataset(user);
            
            // Update last sync time
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('lastSyncTime', this.lastSyncTime);
            
            // Reset retry attempts on successful sync
            this.retryAttempts = 0;
            
            console.log('Data synchronization completed successfully');
            
        } catch (error) {
            console.error('Error during data synchronization:', error);
            await this.handleSyncError(error);
        }
    }

    async syncUserData(user) {
        try {
            // Get user data from Firebase
            const userData = await window.firebaseAuth.getUserData(user.uid);
            
            if (userData) {
                // Update local storage
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Sync with backend if available
                if (window.CLVApi) {
                    await window.CLVApi.updateCustomerFromUserActivity(userData);
                }
            }
        } catch (error) {
            console.error('Error syncing user data:', error);
            throw error;
        }
    }

    async syncActivityData(user) {
        try {
            // Get recent activity data from Firebase
            const activities = await this.getRecentActivities(user.uid);
            
            if (activities && activities.length > 0) {
                // Process activities for insights
                const insights = this.processActivities(activities);
                
                // Update user statistics
                await this.updateUserStatistics(user, insights);
                
                // Generate customer data from activities
                const customerData = await this.generateCustomerDataFromActivities(user, insights);
                
                if (customerData) {
                    // Update Firebase dataset
                    await window.firebaseAuth.updateGlobalDataset(user, 'sync_update');
                    
                    // Sync with backend
                    if (window.CLVApi) {
                        await window.CLVApi.updateCustomerFromUserActivity(customerData);
                    }
                }
            }
        } catch (error) {
            console.error('Error syncing activity data:', error);
            throw error;
        }
    }

    async syncCustomerDataset(user) {
        try {
            // Get customer data from Firebase
            const { db } = await import('./firebase-config.js');
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const customerRef = doc(db, 'globalDataset', user.uid);
            const customerSnap = await getDoc(customerRef);
            
            if (customerSnap.exists()) {
                const customerData = customerSnap.data();
                
                // Check if backend has this customer
                const backendCustomers = await window.CLVApi.getCustomers();
                const existingCustomer = backendCustomers.customers?.find(c => c.id === user.uid);
                
                if (!existingCustomer || this.needsUpdate(existingCustomer, customerData)) {
                    // Add or update customer in backend
                    await window.CLVApi.addCustomer(customerData);
                    console.log('Customer data synced to backend:', customerData);
                }
            }
        } catch (error) {
            console.error('Error syncing customer dataset:', error);
            // Don't throw error as backend might not be available
        }
    }

    async getRecentActivities(userId) {
        try {
            const { db } = await import('./firebase-config.js');
            const { collection, query, where, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const activitiesRef = collection(db, 'userActivities');
            const q = query(
                activitiesRef,
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
            
            const querySnapshot = await getDocs(q);
            const activities = [];
            
            querySnapshot.forEach((doc) => {
                activities.push(doc.data());
            });
            
            return activities;
        } catch (error) {
            console.error('Error getting recent activities:', error);
            return [];
        }
    }

    processActivities(activities) {
        const insights = {
            totalActivities: activities.length,
            loginCount: 0,
            pageViews: 0,
            clicks: 0,
            formSubmissions: 0,
            sessionDuration: 0,
            engagementScore: 0,
            lastActivity: null
        };

        activities.forEach(activity => {
            switch (activity.activityType) {
                case 'login':
                case 'signup':
                    insights.loginCount++;
                    break;
                case 'page_view':
                    insights.pageViews++;
                    break;
                case 'click':
                    insights.clicks++;
                    break;
                case 'form_submit':
                    insights.formSubmissions++;
                    break;
            }
            
            if (!insights.lastActivity || activity.timestamp > insights.lastActivity) {
                insights.lastActivity = activity.timestamp;
            }
        });

        // Calculate engagement score
        insights.engagementScore = Math.min(100,
            (insights.clicks * 2) +
            (insights.formSubmissions * 10) +
            (insights.pageViews * 1) +
            (insights.loginCount * 5)
        );

        return insights;
    }

    async updateUserStatistics(user, insights) {
        try {
            const { db } = await import('./firebase-config.js');
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userStatsRef = doc(db, 'userStats', user.uid);
            const updateData = {
                ...insights,
                lastSyncTime: new Date().toISOString(),
                userId: user.uid,
                email: user.email
            };
            
            await setDoc(userStatsRef, updateData, { merge: true });
        } catch (error) {
            console.error('Error updating user statistics:', error);
        }
    }

    async generateCustomerDataFromActivities(user, insights) {
        try {
            // Base CLV values
            let averagePurchaseValue = 200;
            let purchaseFrequency = 10;
            let customerLifespan = 2.5;

            // Adjust based on engagement
            const engagementMultiplier = insights.engagementScore / 100;
            averagePurchaseValue = Math.floor(averagePurchaseValue * (1 + engagementMultiplier * 0.4));
            purchaseFrequency = Math.floor(purchaseFrequency * (1 + engagementMultiplier * 0.3));
            customerLifespan = parseFloat((customerLifespan * (1 + engagementMultiplier * 0.2)).toFixed(1));

            // Adjust based on specific activities
            if (insights.formSubmissions > 2) {
                averagePurchaseValue += 100; // High intent users
            }
            
            if (insights.loginCount > 5) {
                customerLifespan += 0.5; // Loyal users
            }

            const clv = Math.floor(averagePurchaseValue * purchaseFrequency * customerLifespan);

            return {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                averagePurchaseValue,
                purchaseFrequency,
                customerLifespan,
                clv,
                engagementScore: insights.engagementScore,
                totalActivities: insights.totalActivities,
                lastUpdated: new Date().toISOString(),
                source: 'data_sync'
            };
        } catch (error) {
            console.error('Error generating customer data from activities:', error);
            return null;
        }
    }

    needsUpdate(existingCustomer, newCustomerData) {
        if (!existingCustomer.lastUpdated || !newCustomerData.lastUpdated) {
            return true;
        }
        
        return new Date(newCustomerData.lastUpdated) > new Date(existingCustomer.lastUpdated);
    }

    async handleSyncError(error) {
        this.retryAttempts++;
        
        if (this.retryAttempts < this.maxRetries) {
            console.log(`Sync failed, retrying in 30 seconds (attempt ${this.retryAttempts}/${this.maxRetries})`);
            setTimeout(() => this.performSync(), 30000);
        } else {
            console.error('Max sync retry attempts reached. Will try again on next interval.');
            this.retryAttempts = 0;
        }
    }

    // Public methods
    getLastSyncTime() {
        return this.lastSyncTime || localStorage.getItem('lastSyncTime');
    }

    getSyncStatus() {
        return {
            isRunning: this.isRunning,
            lastSyncTime: this.getLastSyncTime(),
            retryAttempts: this.retryAttempts,
            isOnline: navigator.onLine
        };
    }

    async forcSync() {
        console.log('Force sync requested');
        await this.performSync();
    }

    destroy() {
        this.pauseSync();
        console.log('Data Sync Service destroyed');
    }
}

// Initialize global sync service
window.DataSyncService = new DataSyncService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSyncService;
}
