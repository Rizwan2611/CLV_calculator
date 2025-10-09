// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqJdliUTcL1Ig8ppypKr8K7zjpsFCllPQ",
  authDomain: "clv-calculator-de6e1.firebaseapp.com",
  projectId: "clv-calculator-de6e1",
  storageBucket: "clv-calculator-de6e1.firebasestorage.app",
  messagingSenderId: "38346875315",
  appId: "1:38346875315:web:892ef377ea9989314cebc6",
  measurementId: "G-52MR1KCT4K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Authentication Helper Class
class FirebaseAuth {
    constructor() {
        this.auth = auth;
        this.db = db;
        this.analytics = analytics;
        this.currentUser = null;
        this.authReady = false;
        this.googleProvider = new GoogleAuthProvider();
        
        // Configure Google provider
        this.googleProvider.addScope('email');
        this.googleProvider.addScope('profile');
        this.googleProvider.setCustomParameters({
            prompt: 'select_account'
        });
        
        // Listen for auth state changes
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            this.authReady = true;
            this.handleAuthStateChange(user);
        });
    }

    // Handle authentication state changes
    handleAuthStateChange(user) {
        if (user) {
            // User is signed in
            console.log('User signed in:', user.email);
            localStorage.setItem('clv_authenticated', 'true');
            localStorage.setItem('clv_user_email', user.email);
            localStorage.setItem('clv_user_name', user.displayName || user.email.split('@')[0]);
            localStorage.setItem('clv_user_uid', user.uid);
            
            // Track user activity and update dataset
            this.trackUserActivity(user, 'login');
        } else {
            // User is signed out
            console.log('User signed out');
            localStorage.removeItem('clv_authenticated');
            localStorage.removeItem('clv_user_email');
            localStorage.removeItem('clv_user_name');
            localStorage.removeItem('clv_user_uid');
        }
    }

    // Sign up with email and password
    async signUp(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            await setDoc(doc(this.db, 'users', user.uid), {
                displayName: displayName,
                email: email,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });

            // Log analytics event
            logEvent(this.analytics, 'sign_up', {
                method: 'email'
            });

            // Track signup activity and update dataset
            await this.trackUserActivity(user, 'signup');

            return {
                success: true,
                user: user,
                message: 'Account created successfully!'
            };
        } catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Update last login time
            await setDoc(doc(this.db, 'users', user.uid), {
                lastLogin: new Date().toISOString()
            }, { merge: true });

            // Log analytics event
            logEvent(this.analytics, 'login', {
                method: 'email'
            });

            return {
                success: true,
                user: user,
                message: 'Signed in successfully!'
            };
        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        try {
            // Try direct popup first
            let result;
            try {
                result = await signInWithPopup(this.auth, this.googleProvider);
            } catch (popupError) {
                // If popup fails due to domain issues, try alternative method
                if (popupError.code === 'auth/unauthorized-domain' || 
                    popupError.code === 'auth/operation-not-allowed') {
                    return await this.signInWithGoogleRedirect();
                }
                throw popupError;
            }
            
            const user = result.user;
            
            // Save additional user data to Firestore
            await setDoc(doc(this.db, 'users', user.uid), {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                provider: 'google'
            }, { merge: true });

            // Log analytics event
            logEvent(this.analytics, 'login', {
                method: 'google'
            });

            // Track Google login activity and update dataset
            await this.trackUserActivity(user, 'login');

            return {
                success: true,
                user: user,
                message: 'Signed in with Google successfully!'
            };
        } catch (error) {
            console.error('Google sign in error:', error);
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    // Sign out
    async signOut() {
        try {
            await signOut(this.auth);
            return {
                success: true,
                message: 'Signed out successfully!'
            };
        } catch (error) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: error.code,
                message: 'Error signing out'
            };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        // If Firebase auth is ready, use currentUser, otherwise check localStorage
        if (this.authReady) {
            return this.currentUser !== null;
        } else {
            return localStorage.getItem('clv_authenticated') === 'true';
        }
    }

    // Wait for Firebase auth to be ready
    async waitForAuth() {
        return new Promise((resolve) => {
            if (this.authReady) {
                resolve(this.currentUser);
            } else {
                // Wait for the auth state to change once
                setTimeout(() => {
                    resolve(this.currentUser);
                }, 500);
            }
        });
    }

    // Get user data from Firestore
    async getUserData(uid) {
        try {
            const docRef = doc(this.db, 'users', uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                console.log('No user data found');
                return null;
            }
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Convert Firebase error codes to user-friendly messages
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/invalid-credential': 'Invalid email or password. Please try again.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
            'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups and try again.',
            'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
            'auth/account-exists-with-different-credential': 'An account already exists with this email but different sign-in method.',
            'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations. Please contact the administrator.',
            'auth/operation-not-allowed': 'Google sign-in is not enabled. Please contact the administrator.'
        };

        return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
    }

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'auth.html';
            return false;
        }
        return true;
    }

    // Track user activity and update dataset
    async trackUserActivity(user, activityType) {
        try {
            const timestamp = new Date().toISOString();
            const activityData = {
                userId: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                activityType: activityType, // 'login', 'signup', 'logout'
                timestamp: timestamp,
                sessionId: this.generateSessionId(),
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            };

            // Store activity in Firestore
            await this.storeUserActivity(activityData);
            
            // Update user statistics
            await this.updateUserStats(user, activityType);
            
            // Update global dataset
            await this.updateGlobalDataset(user, activityType);
            
            console.log('User activity tracked:', activityData);
        } catch (error) {
            console.error('Error tracking user activity:', error);
        }
    }

    // Store user activity in Firestore
    async storeUserActivity(activityData) {
        try {
            const activityRef = doc(this.db, 'userActivities', `${activityData.userId}_${Date.now()}`);
            await setDoc(activityRef, activityData);
        } catch (error) {
            console.error('Error storing user activity:', error);
        }
    }

    // Update user statistics
    async updateUserStats(user, activityType) {
        try {
            const userStatsRef = doc(this.db, 'userStats', user.uid);
            const userStatsSnap = await getDoc(userStatsRef);
            
            let stats = {
                userId: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                totalLogins: 0,
                lastLogin: new Date().toISOString(),
                firstLogin: new Date().toISOString(),
                sessionCount: 0,
                averageSessionDuration: 0,
                totalTimeSpent: 0,
                deviceTypes: [],
                browsers: [],
                locations: []
            };

            if (userStatsSnap.exists()) {
                stats = { ...stats, ...userStatsSnap.data() };
            }

            // Update stats based on activity type
            if (activityType === 'login' || activityType === 'signup') {
                stats.totalLogins += 1;
                stats.lastLogin = new Date().toISOString();
                stats.sessionCount += 1;
                
                // Track device and browser info
                const deviceInfo = this.getDeviceInfo();
                if (!stats.deviceTypes.includes(deviceInfo.device)) {
                    stats.deviceTypes.push(deviceInfo.device);
                }
                if (!stats.browsers.includes(deviceInfo.browser)) {
                    stats.browsers.push(deviceInfo.browser);
                }
            }

            await setDoc(userStatsRef, stats, { merge: true });
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    // Update global dataset with user information
    async updateGlobalDataset(user, activityType) {
        try {
            // Generate customer data based on user activity
            const customerData = await this.generateCustomerData(user, activityType);
            
            // Store in global dataset collection
            const datasetRef = doc(this.db, 'globalDataset', user.uid);
            await setDoc(datasetRef, customerData, { merge: true });
            
            // Update aggregated statistics
            await this.updateAggregatedStats();
            
            // Sync with backend if available
            await this.syncWithBackend(customerData);
            
        } catch (error) {
            console.error('Error updating global dataset:', error);
        }
    }

    // Generate customer data based on user behavior
    async generateCustomerData(user, activityType) {
        try {
            const userStats = await this.getUserStats(user.uid);
            const timestamp = new Date().toISOString();
            
            // Generate realistic CLV data based on user behavior
            const baseValue = Math.floor(Math.random() * 500) + 100; // ₹100-₹600
            const frequency = Math.floor(Math.random() * 24) + 1; // 1-24 times per year
            const lifespan = Math.floor(Math.random() * 5) + 1; // 1-5 years
            
            // Adjust values based on user activity patterns
            let adjustedValue = baseValue;
            let adjustedFrequency = frequency;
            let adjustedLifespan = lifespan;
            
            if (userStats) {
                // More active users tend to have higher values
                const activityMultiplier = Math.min(userStats.totalLogins / 10, 2);
                adjustedValue = Math.floor(baseValue * (1 + activityMultiplier * 0.3));
                adjustedFrequency = Math.floor(frequency * (1 + activityMultiplier * 0.2));
                adjustedLifespan = Math.floor(lifespan * (1 + activityMultiplier * 0.1));
            }
            
            const clv = adjustedValue * adjustedFrequency * adjustedLifespan;
            
            return {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                averagePurchaseValue: adjustedValue,
                purchaseFrequency: adjustedFrequency,
                customerLifespan: adjustedLifespan,
                clv: clv,
                activityType: activityType,
                lastUpdated: timestamp,
                isActive: true,
                source: 'user_activity'
            };
        } catch (error) {
            console.error('Error generating customer data:', error);
            return null;
        }
    }

    // Get user statistics
    async getUserStats(userId) {
        try {
            const userStatsRef = doc(this.db, 'userStats', userId);
            const userStatsSnap = await getDoc(userStatsRef);
            return userStatsSnap.exists() ? userStatsSnap.data() : null;
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }

    // Update aggregated statistics
    async updateAggregatedStats() {
        try {
            const statsRef = doc(this.db, 'aggregatedStats', 'global');
            const timestamp = new Date().toISOString();
            
            const stats = {
                totalUsers: await this.getTotalUsers(),
                activeUsers: await this.getActiveUsers(),
                totalSessions: await this.getTotalSessions(),
                lastUpdated: timestamp
            };
            
            await setDoc(statsRef, stats, { merge: true });
        } catch (error) {
            console.error('Error updating aggregated stats:', error);
        }
    }

    // Sync with backend API
    async syncWithBackend(customerData) {
        try {
            if (window.CLVApi) {
                // Add customer to backend dataset
                await window.CLVApi.addCustomer(customerData);
                console.log('Customer data synced with backend:', customerData);
            }
        } catch (error) {
            console.error('Error syncing with backend:', error);
            // Don't throw error as this is optional
        }
    }

    // Alternative Google sign-in using redirect to authorized domain
    async signInWithGoogleRedirect() {
        try {
            // Create a faster authentication flow
            const authWindow = window.open(
                `https://clv-calculator-de6e1.firebaseapp.com/auth.html?mode=google&origin=${encodeURIComponent(window.location.origin)}`,
                'googleAuth',
                'width=480,height=580,scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no'
            );

            return new Promise((resolve, reject) => {
                // Faster checking interval
                const checkClosed = setInterval(() => {
                    if (authWindow.closed) {
                        clearInterval(checkClosed);
                        reject(new Error('Authentication window was closed'));
                    }
                }, 500);

                // Set timeout for faster failure detection
                const timeout = setTimeout(() => {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    authWindow.close();
                    reject(new Error('Authentication timeout - please try again'));
                }, 30000); // 30 seconds timeout

                // Listen for authentication result
                const messageHandler = (event) => {
                    if (event.origin !== 'https://clv-calculator-de6e1.firebaseapp.com') {
                        return;
                    }

                    clearTimeout(timeout);
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);

                    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                        authWindow.close();
                        // Immediately resolve with user data
                        resolve({
                            success: true,
                            user: event.data.user,
                            message: 'Successfully signed in with Google!'
                        });
                    } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
                        authWindow.close();
                        reject(new Error(event.data.error));
                    }
                };

                window.addEventListener('message', messageHandler);
            });
        } catch (error) {
            console.error('Google redirect auth error:', error);
            return {
                success: false,
                error: 'redirect-failed',
                message: 'Unable to complete Google sign-in. Please try email/password authentication.'
            };
        }
    }

    // Check if current domain is authorized for Google Auth
    isAuthorizedDomain() {
        const currentDomain = window.location.hostname;
        const authorizedDomains = [
            'localhost',
            '127.0.0.1',
            'clv-calculator-de6e1.firebaseapp.com',
            'clv-calculator-de6e1.web.app'
        ];
        
        return authorizedDomains.includes(currentDomain);
    }

    // Get Firebase hosting URL for redirects
    getFirebaseHostingUrl() {
        return 'https://clv-calculator-de6e1.firebaseapp.com';
    }

    // Helper methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getDeviceInfo() {
        const userAgent = navigator.userAgent;
        let device = 'Desktop';
        let browser = 'Unknown';
        
        // Detect device type
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            device = 'Mobile';
        } else if (/Tablet|iPad/.test(userAgent)) {
            device = 'Tablet';
        }
        
        // Detect browser
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        
        return { device, browser };
    }

    async getTotalUsers() {
        // This would typically query Firestore for total user count
        // For now, return a placeholder
        return 1;
    }

    async getActiveUsers() {
        // This would typically query Firestore for active users in last 30 days
        // For now, return a placeholder
        return 1;
    }

    async getTotalSessions() {
        // This would typically query Firestore for total session count
        // For now, return a placeholder
        return 1;
    }
}

// Create global Firebase Auth instance
const firebaseAuth = new FirebaseAuth();
window.firebaseAuth = firebaseAuth;

// Export for use in other files
export { firebaseAuth, auth, db, analytics };
