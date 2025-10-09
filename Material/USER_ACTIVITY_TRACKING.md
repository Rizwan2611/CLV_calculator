# User Activity Tracking & Dataset Auto-Update System

## Overview

This system automatically tracks user login/signup activities and updates your CLV dataset in real-time. It provides comprehensive user behavior analytics and seamlessly integrates with both Firebase and your C++ backend.

## Features

### 🔐 Authentication Tracking
- **Login Events**: Automatically tracked when users sign in
- **Signup Events**: New user registrations are captured
- **Google OAuth**: Supports both email/password and Google sign-in
- **Session Management**: Tracks session duration and activity

### 📊 User Activity Analytics
- **Page Views**: Tracks which pages users visit
- **Click Tracking**: Monitors button clicks and interactions
- **Form Submissions**: Captures form completion events
- **Scroll Behavior**: Measures user engagement depth
- **Session Duration**: Calculates time spent on site

### 🔄 Automatic Dataset Updates
- **Real-time Sync**: Updates dataset immediately on login/signup
- **Intelligent CLV Calculation**: Generates realistic CLV values based on user behavior
- **Multi-source Integration**: Syncs data between Firebase, backend, and local storage
- **Offline Support**: Queues updates when offline, syncs when connection restored

## System Architecture

```
User Login/Signup
       ↓
Firebase Authentication
       ↓
Activity Tracking System
       ↓
Data Processing & CLV Generation
       ↓
Multi-destination Sync:
├── Firebase Firestore
├── C++ Backend API
└── Local Storage
```

## Data Flow

### 1. User Authentication
```javascript
// Automatic tracking on login/signup
firebaseAuth.signIn(email, password)
  ↓
trackUserActivity(user, 'login')
  ↓
generateCustomerData(user, activityType)
  ↓
updateGlobalDataset(user, 'login')
```

### 2. Activity Monitoring
```javascript
// Continuous activity tracking
UserActivityTracker.trackClick(event)
UserActivityTracker.trackPageView()
UserActivityTracker.trackFormSubmission()
  ↓
analyzeActivities(activities)
  ↓
updateDatasetFromActivities(user, insights)
```

### 3. Data Synchronization
```javascript
// Periodic sync every 5 minutes
DataSyncService.performSync()
  ↓
syncUserData(user)
syncActivityData(user)
syncCustomerDataset(user)
  ↓
Backend API & Firebase Update
```

## Generated Customer Data Structure

```javascript
{
  id: "user_uid",
  name: "User Display Name",
  email: "user@example.com",
  averagePurchaseValue: 250,     // ₹100-₹600 based on activity
  purchaseFrequency: 12,         // 1-24 times/year based on engagement
  customerLifespan: 3,           // 1-5 years based on loyalty
  clv: 9000,                     // Calculated: APV × Frequency × Lifespan
  engagementScore: 75,           // 0-100 based on interactions
  activityType: "login",         // login, signup, activity_update
  lastUpdated: "2025-10-06T22:37:15Z",
  isActive: true,
  source: "user_activity"
}
```

## CLV Calculation Logic

### Base Values
- **Average Purchase Value**: ₹100-₹600 (random baseline)
- **Purchase Frequency**: 1-24 times per year
- **Customer Lifespan**: 1-5 years

### Activity-Based Adjustments
- **High Engagement**: +30% to purchase value, +20% to frequency
- **Form Submissions**: +₹50 to purchase value (indicates intent)
- **Long Sessions**: +0.5 years to lifespan (indicates interest)
- **Multiple Logins**: +0.5 years to lifespan (indicates loyalty)

### Engagement Score Calculation
```javascript
engagementScore = Math.min(100,
  (clicks × 2) +
  (formSubmissions × 10) +
  (pageViews × 1) +
  (loginCount × 5)
);
```

## Firebase Collections

### 1. `users` Collection
```javascript
{
  displayName: "John Doe",
  email: "john@example.com",
  createdAt: "2025-10-06T22:37:15Z",
  lastLogin: "2025-10-06T22:37:15Z",
  provider: "email" // or "google"
}
```

### 2. `userActivities` Collection
```javascript
{
  userId: "user_uid",
  activityType: "login",
  timestamp: "2025-10-06T22:37:15Z",
  sessionId: "session_12345",
  userAgent: "Mozilla/5.0...",
  platform: "MacIntel",
  language: "en-US"
}
```

### 3. `userStats` Collection
```javascript
{
  userId: "user_uid",
  totalLogins: 5,
  sessionCount: 8,
  averageSessionDuration: 180000,
  deviceTypes: ["Desktop", "Mobile"],
  browsers: ["Chrome", "Safari"],
  engagementScore: 75
}
```

### 4. `globalDataset` Collection
```javascript
{
  id: "user_uid",
  name: "John Doe",
  email: "john@example.com",
  averagePurchaseValue: 250,
  purchaseFrequency: 12,
  customerLifespan: 3,
  clv: 9000,
  lastUpdated: "2025-10-06T22:37:15Z"
}
```

## API Integration

### Backend Sync
```javascript
// Automatic sync with C++ backend
CLVApi.addCustomer(customerData)
  ↓
POST /api/add-customer
  ↓
customers.json updated
```

### Error Handling
- **Network Failures**: Queued for retry (max 3 attempts)
- **Backend Unavailable**: Firebase-only storage with periodic retry
- **Authentication Errors**: Graceful fallback to anonymous tracking

## Usage Examples

### Manual Activity Tracking
```javascript
// Track custom events
UserActivityTracker.trackCustomEvent('button_click', {
  buttonName: 'Start Calculator',
  page: 'home'
});

// Track purchases
UserActivityTracker.trackPurchase({
  amount: 299,
  currency: 'INR',
  productId: 'premium_plan'
});

// Track calculator usage
UserActivityTracker.trackCalculatorUsage({
  averagePurchaseValue: 200,
  frequency: 12,
  lifespan: 2,
  calculatedCLV: 4800
});
```

### Force Data Sync
```javascript
// Trigger immediate sync
await DataSyncService.forcSync();

// Check sync status
const status = DataSyncService.getSyncStatus();
console.log('Last sync:', status.lastSyncTime);
```

### Access User Statistics
```javascript
// Get current session stats
const sessionStats = UserActivityTracker.getSessionStats();

// Get user data from Firebase
const userData = await firebaseAuth.getUserData(userId);
```

## Configuration

### Sync Intervals
- **Activity Sync**: Every 30 seconds
- **Full Data Sync**: Every 5 minutes
- **Retry Attempts**: 3 times with 30-second delays

### Storage Locations
- **Primary**: Firebase Firestore
- **Secondary**: C++ Backend (customers.json)
- **Cache**: Browser localStorage

## Monitoring & Analytics

### Console Logs
- User authentication events
- Activity tracking confirmations
- Data sync status updates
- Error messages with context

### Firebase Analytics Events
- `sign_up` with method (email/google)
- `login` with method (email/google)
- Custom events for user interactions

## Privacy & Security

### Data Protection
- User consent implied through authentication
- No sensitive personal data stored beyond email/name
- All data encrypted in transit (HTTPS/Firebase Security Rules)

### Data Retention
- Activity data: 90 days (configurable)
- User profiles: Until account deletion
- Aggregated statistics: Indefinite (anonymized)

## Troubleshooting

### Common Issues

1. **Sync Not Working**
   - Check network connection
   - Verify Firebase configuration
   - Check browser console for errors

2. **Backend Integration Failing**
   - Ensure C++ server is running on localhost:8080
   - Check CORS settings
   - Verify API endpoints

3. **Data Not Updating**
   - Check user authentication status
   - Verify Firebase permissions
   - Check activity tracker initialization

### Debug Commands
```javascript
// Check system status
console.log('Auth:', firebaseAuth.isAuthenticated());
console.log('Tracker:', UserActivityTracker.getSessionStats());
console.log('Sync:', DataSyncService.getSyncStatus());

// Force refresh data
await firebaseAuth.trackUserActivity(user, 'debug');
await DataSyncService.forcSync();
```

## Future Enhancements

### Planned Features
- **Machine Learning**: Predictive CLV modeling
- **A/B Testing**: Experiment tracking
- **Real-time Dashboards**: Live activity monitoring
- **Advanced Segmentation**: User behavior clustering
- **Export Capabilities**: Data export to CSV/Excel

### Integration Opportunities
- **CRM Systems**: Salesforce, HubSpot integration
- **Analytics Platforms**: Google Analytics 4, Mixpanel
- **Marketing Tools**: Email automation triggers
- **Business Intelligence**: Power BI, Tableau connectors

---

This system provides a comprehensive foundation for user activity tracking and automatic dataset updates, ensuring your CLV calculator always has fresh, relevant data based on real user behavior.
