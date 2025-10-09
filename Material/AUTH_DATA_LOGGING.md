# Authentication Data Logging System

## Overview

This system captures and stores live signup and login data from users in real-time, saving comprehensive authentication information to JSON files both locally and on the backend server.

## Features

### 🔐 **Real-time Authentication Logging**
- **Automatic Capture**: Logs every login and signup event automatically
- **Multiple Providers**: Supports email/password and Google OAuth authentication
- **Comprehensive Data**: Captures user info, device details, session data, and more
- **Dual Storage**: Saves to both frontend localStorage and backend JSON files

### 📊 **Data Structure**

Each authentication event captures:

```javascript
{
  // User Information
  "userId": "firebase_uid_12345",
  "email": "user@example.com", 
  "displayName": "John Doe",
  "photoURL": "https://...",
  
  // Authentication Details
  "eventType": "login", // or "signup"
  "provider": "email", // or "google"
  "timestamp": "2025-10-06T22:37:15Z",
  "sessionId": "auth_session_1728234235_abc123",
  
  // User Metadata
  "creationTime": "2025-10-06T22:37:15Z",
  "lastSignInTime": "2025-10-06T22:37:15Z",
  "isNewUser": false,
  
  // Device & Browser Information
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "platform": "MacIntel",
  "language": "en-US",
  "timezone": "Asia/Kolkata",
  "screenResolution": "1920x1080",
  "deviceType": "desktop", // mobile, tablet, desktop
  "browserInfo": {
    "name": "chrome",
    "version": "118.0.0.0",
    "fullUserAgent": "..."
  },
  
  // Location Information
  "ipAddress": "127.0.0.1", // Added by backend
  "location": null, // Can be enhanced with geolocation
  
  // Session Information
  "referrer": "https://google.com",
  "currentUrl": "https://yoursite.com/auth.html",
  "pageTitle": "Sign In - CLV Metrics",
  
  // Additional Metadata
  "isOnline": true,
  "connectionType": "4g",
  "firebaseUID": "firebase_uid_12345",
  "customerId": "firebase_uid_12345",
  
  // Timestamps
  "timestampUnix": 1728234235000,
  "timestampLocal": "10/6/2025, 10:37:15 PM",
  
  // System Info
  "source": "web_app",
  "version": "1.0.0"
}
```

## Storage Locations

### 1. **Frontend Storage** (localStorage)
- **File**: Browser localStorage as `authLogs`
- **Purpose**: Immediate access and offline backup
- **Retention**: Last 100 events per user
- **Format**: JSON array

### 2. **Backend Storage** (JSON Files)
- **Main File**: `auth_logs.json` - All authentication events
- **Daily Files**: `daily_auth_logs/auth_YYYY-MM-DD.json` - Daily segregated logs
- **Format**: Structured JSON with metadata

### 3. **Export Options**
- **CSV Export**: `auth_export_timestamp.csv` - For data analysis
- **JSON Export**: Direct download from frontend

## API Endpoints

### **POST /api/log-auth**
Log a new authentication event
```javascript
// Request body: AuthEvent JSON object
// Response: {"status": "success", "message": "..."}
```

### **GET /api/auth-stats**
Get authentication statistics
```javascript
// Response:
{
  "status": "success",
  "authStatistics": {
    "totalEvents": 150,
    "signups": 45,
    "logins": 105,
    "googleAuth": 80,
    "emailAuth": 70,
    "mobileUsers": 60,
    "desktopUsers": 90,
    "uniqueUsers": 45
  }
}
```

### **GET /api/auth-logs**
Get recent authentication logs (last 20 events)
```javascript
// Response:
{
  "status": "success", 
  "authLogs": [...],
  "totalEvents": 20
}
```

### **GET /api/auth-export**
Export authentication logs to CSV
```javascript
// Response:
{
  "status": "success",
  "message": "Authentication logs exported successfully",
  "filename": "auth_export_1728234235.csv"
}
```

## File Structure

### **Main Auth Logs File** (`auth_logs.json`)
```json
{
  "metadata": {
    "totalEvents": 150,
    "lastUpdated": "2025-10-06T22:37:15Z",
    "version": "1.0.0"
  },
  "authEvents": [
    {
      "userId": "...",
      "email": "...",
      // ... full auth event data
    }
  ]
}
```

### **Daily Auth Logs** (`daily_auth_logs/auth_2025-10-06.json`)
```json
{
  "date": "2025-10-06",
  "totalEvents": 25,
  "lastUpdated": "2025-10-06T22:37:15Z",
  "events": [
    {
      // ... auth event data for this day
    }
  ]
}
```

## Usage Examples

### **Frontend JavaScript**
```javascript
// Get local auth logs
const logs = AuthDataLogger.getLocalAuthLogs();

// Get logs by type
const signups = AuthDataLogger.getAuthLogsByType('signup');
const logins = AuthDataLogger.getAuthLogsByType('login');

// Get logs by date range
const today = new Date();
const yesterday = new Date(today.getTime() - 24*60*60*1000);
const recentLogs = AuthDataLogger.getAuthLogsByDateRange(yesterday, today);

// Export logs
AuthDataLogger.exportAuthLogs(); // Downloads JSON file

// Get statistics
const stats = AuthDataLogger.getAuthStatistics();
console.log('Total signups:', stats.signups);
console.log('Total logins:', stats.logins);
console.log('Unique users:', stats.uniqueUsers);

// Clear local logs
AuthDataLogger.clearLocalAuthLogs();
```

### **Backend C++**
```cpp
// Create auth logger
AuthLogger authLogger("auth_logs.json");

// Log authentication event from JSON
std::string authEventJson = "{ ... }";
authLogger.logAuthEventFromJson(authEventJson);

// Get statistics
auto stats = authLogger.getAuthStatistics();
std::cout << "Total events: " << stats["totalEvents"] << std::endl;

// Get events by type
auto signups = authLogger.getEventsByType("signup");
auto logins = authLogger.getEventsByType("login");

// Get events by user
auto userEvents = authLogger.getEventsByUser("user_id_123");

// Export to CSV
authLogger.exportToCSV("auth_data.csv");

// Get recent events
auto recent = authLogger.getRecentEvents(10);
```

## Integration Flow

```
User Login/Signup
       ↓
Firebase Authentication
       ↓
AuthDataLogger.logAuthEvent()
       ↓
┌─────────────────┬─────────────────┐
│   Frontend      │    Backend      │
│   localStorage  │   JSON Files    │
└─────────────────┴─────────────────┘
       ↓                    ↓
   Immediate Access    Persistent Storage
   Offline Backup      Analytics & Export
```

## Security & Privacy

### **Data Protection**
- No sensitive data (passwords) stored
- Only authentication metadata captured
- HTTPS encryption for data transmission
- Local storage encrypted by browser

### **Compliance**
- GDPR compliant (user consent through authentication)
- Data minimization (only necessary fields)
- Right to deletion (clear methods provided)
- Transparent data collection

## Analytics Insights

### **User Behavior Analysis**
- **Login Patterns**: Peak login times, frequency
- **Device Preferences**: Mobile vs Desktop usage
- **Browser Analytics**: Popular browsers and versions
- **Geographic Insights**: Timezone distribution
- **Authentication Methods**: Email vs Google OAuth preference

### **Business Metrics**
- **User Acquisition**: New signups over time
- **User Retention**: Login frequency patterns
- **Platform Performance**: Device-specific success rates
- **Security Monitoring**: Unusual login patterns

## Monitoring & Alerts

### **Real-time Monitoring**
```javascript
// Monitor authentication events
setInterval(() => {
  const stats = AuthDataLogger.getAuthStatistics();
  if (stats.totalEvents > 1000) {
    console.log('High authentication volume detected');
  }
}, 60000); // Check every minute
```

### **Error Tracking**
- Failed authentication attempts
- Network connectivity issues
- Data storage failures
- API endpoint errors

## Backup & Recovery

### **Automatic Backups**
- Daily JSON files for incremental backup
- Local storage as immediate backup
- CSV exports for external backup

### **Data Recovery**
- Restore from daily files
- Merge multiple backup sources
- Data validation and cleanup tools

## Performance Considerations

### **Frontend Optimization**
- Asynchronous logging (non-blocking)
- Local storage size management (100 events max)
- Retry mechanism for failed API calls
- Debounced API requests

### **Backend Optimization**
- Efficient JSON file handling
- Thread-safe logging operations
- Memory management for large datasets
- Indexed file structure for quick queries

## Future Enhancements

### **Planned Features**
- **Real-time Dashboard**: Live authentication monitoring
- **Machine Learning**: Anomaly detection for security
- **Advanced Analytics**: User journey mapping
- **Integration APIs**: Connect with external analytics tools
- **Mobile App Support**: React Native integration
- **Database Storage**: PostgreSQL/MongoDB option
- **Geolocation**: IP-based location tracking
- **A/B Testing**: Authentication flow optimization

### **Scalability**
- Microservices architecture
- Database sharding
- CDN integration
- Load balancing
- Caching strategies

---

This authentication data logging system provides comprehensive insights into user behavior while maintaining security and privacy standards. The dual storage approach ensures data availability and enables both real-time monitoring and historical analysis.
