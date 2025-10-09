// CLV Calculator API Client
// Handles communication between frontend and backend

class CLVApi {
    constructor(baseUrl) {
        // Auto-detect environment and set appropriate API URL
        if (!baseUrl) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.baseUrl = 'http://localhost:8080';
            } else {
                // Production backend URL - same domain as frontend on Render
                this.baseUrl = window.location.origin;
            }
        } else {
            this.baseUrl = baseUrl;
        }
        console.log('CLVApi initialized with baseUrl:', this.baseUrl);
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            console.log('Making API request to:', url);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('API response:', data);
            return data;
        } catch (error) {
            console.error('API request failed:', {
                url,
                error: error.message,
                config
            });
            
            // Check if it's a network error
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to backend server. Please ensure the server is running');
            }
            
            throw error;
        }
    }

    // Get all customers
    async getCustomers() {
        try {
            const response = await this.request('/api/customers');
            return response;
        } catch (error) {
            Toast?.error('Failed to load customers');
            throw error;
        }
    }
    
    // Get analytics data
    async getAnalytics() {
        try {
            const response = await this.request('/api/analytics');
            return response;
        } catch (error) {
            Toast?.error('Failed to load analytics');
            throw error;
        }
    }

    // Add a new customer
    async addCustomer(customerData) {
        try {
            console.log('Adding customer:', customerData);
            
            // Use GET request with query parameters as workaround for POST body parsing issue
            const params = new URLSearchParams({
                id: customerData.id,
                name: customerData.name,
                averagePurchaseValue: customerData.averagePurchaseValue,
                purchaseFrequency: customerData.purchaseFrequency,
                customerLifespan: customerData.customerLifespan
            });
            
            // Add cache busting parameter
            const timestamp = Date.now();
            const url = `/api/add-customer?${params.toString()}&_t=${timestamp}`;
            console.log('API URL:', url);
            
            const response = await this.request(url);
            console.log('API Response:', response);
            
            if (response.status === 'success') {
                Toast?.success('Customer added successfully!');
            }
            
            return response;
        } catch (error) {
            console.error('Add customer error:', error);
            Toast?.error('Failed to add customer: ' + error.message);
            throw error;
        }
    }

    // Calculate CLV for given parameters
    async calculateCLV(avgPurchaseValue, purchaseFrequency, customerLifespan) {
        return avgPurchaseValue * purchaseFrequency * customerLifespan;
    }

    // Check if server is running
    async checkServerStatus() {
        try {
            const response = await this.request('/api/health');
            return response.status === 'ok';
        } catch (error) {
            return false;
        }
    }

    // Get server health status
    async getServerHealth() {
        try {
            const response = await this.request('/api/health');
            return response;
        } catch (error) {
            return {
                status: 'error',
                message: 'Server is not responding',
                error: error.message
            };
        }
    }

    // Update customer from user activity (for Firebase integration)
    async updateCustomerFromUserActivity(userData) {
        try {
            // This would sync user activity data with backend
            // For now, just log the activity
            console.log('User activity data:', userData);
            return { status: 'success' };
        } catch (error) {
            console.error('Error updating customer from user activity:', error);
            return { status: 'error', message: error.message };
        }
    }

    // Get user-specific analytics
    async getUserAnalytics(userId) {
        try {
            const response = await this.request(`/api/user-analytics?userId=${userId}`);
            return response;
        } catch (error) {
            console.log('User analytics not available from backend');
            return null;
        }
    }

    // Sync Firebase data with backend
    async syncFirebaseData() {
        try {
            if (window.firebaseAuth && window.firebaseAuth.isAuthenticated()) {
                const user = window.firebaseAuth.getCurrentUser();
                if (user) {
                    // Get user's customer data from Firebase
                    const userData = await window.firebaseAuth.getUserData(user.uid);
                    if (userData) {
                        await this.updateCustomerFromUserActivity(userData);
                    }
                }
            }
        } catch (error) {
            console.error('Error syncing Firebase data:', error);
        }
    }
}

// Create global API instance
window.CLVApi = new CLVApi();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CLVApi;
}
