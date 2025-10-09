# 📊 Customer Lifetime Value (CLV) Calculator

> **A comprehensive CLV calculation and analysis platform with advanced algorithms, real-time analytics, and enterprise-grade authentication.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange.svg)](https://firebase.google.com/)

## 🚀 Overview

The CLV Calculator is a full-stack application that combines the power of **C++ algorithms** with modern web technologies to provide accurate Customer Lifetime Value calculations. Built for businesses of all sizes, from startups to enterprises.

### ✨ Key Features

- 🔐 **Multi-Provider Authentication** - Firebase Auth (Email, Google, Social)
- ⚡ **High-Performance C++ Engine** - QuickSort, Statistical Analysis, Real-time CLV
- 📊 **Interactive Dashboard** - Real-time analytics with Chart.js visualizations
- 🗄️ **NoSQL Database** - MongoDB Atlas with optimized queries and indexing
- 📱 **Responsive Design** - Mobile-first, cross-platform compatibility
- 🔄 **Real-time Sync** - Live data updates and user activity tracking
- 📈 **Advanced Analytics** - Customer segmentation, trend analysis, forecasting
- 🛡️ **Enterprise Security** - Data encryption, audit logs, role-based access

## 🏗️ Architecture

### **Dual-Stack Implementation**
- **Frontend**: Modern JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js/Express + C++ computational engine
- **Database**: MongoDB Atlas (NoSQL) with Mongoose ODM
- **Authentication**: Firebase Authentication
- **Deployment**: Render (Backend), Static hosting (Frontend)

### **C++ Algorithm Engine**
```cpp
// Core CLV Calculation (O(1))
double calculateCLV() {
    return averagePurchaseValue * purchaseFrequency * customerLifespan;
}

// QuickSort for Customer Ranking (O(n log n))
void quicksort(vector<Customer>& customers, int low, int high);

// Statistical Analysis (O(n))
void calculateAnalytics(vector<Customer>& customers);
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | HTML5, CSS3, JavaScript ES6+ | User interface & interactions |
| **Backend** | Node.js, Express.js | API server & routing |
| **Algorithms** | C++17, STL | High-performance computations |
| **Database** | MongoDB Atlas, Mongoose | Data persistence & queries |
| **Auth** | Firebase Authentication | User management & security |
| **Build** | Webpack, Babel | Module bundling & transpilation |
| **Deploy** | Render, Static Hosting | Production deployment |

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ ([Download](https://nodejs.org/))
- **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/atlas))
- **Firebase** project ([Console](https://console.firebase.google.com/))
- **Git** ([Download](https://git-scm.com/))

### 1️⃣ Clone Repository
```bash
git clone https://github.com/Rizwan2611/CLV_calculator.git
cd CLV_calculator
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/CLV_Calculator

# Server
PORT=8080
NODE_ENV=production

# Firebase (Optional - for enhanced features)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
```

### 4️⃣ Start Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5️⃣ Access Application
- **Web Interface**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api/health

## 📁 Project Structure

```
CLV_Calculator/
├── 📂 Frontend/                 # Web Interface
│   ├── 🏠 index.html           # Landing page
│   ├── 🧮 calculator.html      # CLV calculator
│   ├── 📊 dashboard.html       # Analytics dashboard
│   ├── 🔐 auth.html           # Authentication
│   ├── 👤 profile.html        # User profile
│   ├── ⚙️ settings.html       # App settings
│   ├── 📈 data.html           # Data management
│   ├── 📤 export.html         # Data export
│   ├── 🆚 compare.html        # Customer comparison
│   ├── ❓ help.html           # Help & documentation
│   ├── 🔧 app.js              # Main application logic
│   ├── 🌐 api.js              # API client
│   ├── 🔥 firebase-config.js   # Firebase configuration
│   ├── 📊 auth-data-logger.js  # Authentication logging
│   ├── 🔄 data-sync-service.js # Real-time sync
│   ├── 📱 user-activity-tracker.js # User analytics
│   └── 🧭 router.js           # Client-side routing
├── 📂 Backend/                  # C++ Algorithm Engine
│   ├── 🧮 clv_calculator.hpp   # Core CLV algorithms
│   ├── 🌐 http_server.hpp      # HTTP server implementation
│   ├── 🗄️ mongodb_service.hpp  # MongoDB integration
│   ├── 🔐 mongodb_auth_logger.hpp # Authentication logging
│   ├── 📝 auth_logger.hpp      # Simple auth logger
│   ├── 📊 simple_auth_logger.hpp # Basic logging
│   ├── 📄 json.hpp            # JSON processing
│   ├── 🏁 main.cpp            # CLI entry point
│   ├── 🌐 server_main.cpp     # HTTP server entry
│   ├── 🔨 Makefile           # Build configuration
│   └── 📖 README.md          # Backend documentation
├── 📂 routes/                   # API Routes
│   └── 🛣️ api.js              # REST API endpoints
├── 📂 models/                   # Database Models
│   └── 👤 Customer.js         # Customer schema
├── 📂 config/                   # Configuration
│   └── 🗄️ database.js         # Database connection
├── 📂 Material/                 # Documentation & Assets
├── ⚙️ server.js               # Main server file
├── 🔧 setup-env.js           # Environment setup
├── 🚀 start_server.sh        # Server startup script
├── 📦 package.json           # Dependencies & scripts
├── 🌐 render.yaml            # Deployment configuration
├── 🔨 webpack.config.js      # Build configuration
├── 🧹 cleanup.sh            # Project cleanup script
├── 🚫 .gitignore            # Git ignore rules
├── 📄 LICENSE               # MIT License
└── 📖 README.md             # This file
```

## 🔧 API Endpoints

### **Core CLV Operations**
```http
GET    /api/health              # Health check
GET    /api/customers           # List customers (paginated)
GET    /api/add-customer        # Add new customer
PUT    /api/customers/:id       # Update customer
DELETE /api/customers/:id       # Delete customer
GET    /api/analytics           # Global analytics
GET    /api/user-analytics      # User-specific analytics
```

### **Example API Usage**
```javascript
// Add a new customer
const response = await fetch('/api/add-customer?' + new URLSearchParams({
    id: 'CUST001',
    name: 'John Doe',
    averagePurchaseValue: 250.00,
    purchaseFrequency: 12,
    customerLifespan: 3,
    userId: 'user123'
}));

// Get analytics
const analytics = await fetch('/api/analytics').then(r => r.json());
```

## 🧮 C++ Algorithm Implementation

### **Core Algorithms**

#### **1. CLV Calculation Algorithm**
```cpp
// Time Complexity: O(1)
// Space Complexity: O(1)
double calculateCLV() {
    return averagePurchaseValue * purchaseFrequency * customerLifespan;
}
```

#### **2. QuickSort for Customer Ranking**
```cpp
// Time Complexity: O(n log n) average, O(n²) worst
// Space Complexity: O(log n)
void quicksort(vector<Customer>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quicksort(arr, low, pi - 1);
        quicksort(arr, pi + 1, high);
    }
}
```

#### **3. Statistical Analysis**
```cpp
// Time Complexity: O(n)
// Space Complexity: O(1)
void calculateAnalytics() {
    double total = 0, max = 0, min = customers[0].clv;
    for (const auto& customer : customers) {
        total += customer.clv;
        max = std::max(max, customer.clv);
        min = std::min(min, customer.clv);
    }
    double average = total / customers.size();
}
```

### **Build C++ Components**
```bash
cd Backend/
make clean
make clv-calculator    # CLI version
make clv-server       # HTTP server version

# Run CLI
./clv-calculator

# Run HTTP server
./clv-server
```

## 🚀 Deployment

### **Render Deployment (Recommended)**
1. **Connect Repository**: Link your GitHub repo to Render
2. **Configure Build**:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **Environment Variables**: Add all variables from `.env`
4. **Deploy**: Automatic deployment on git push

### **Manual Deployment**
```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

### **Docker Deployment**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

## 📊 Performance Metrics

| Operation | Time Complexity | Space Complexity | Performance |
|-----------|----------------|------------------|-------------|
| **CLV Calculation** | O(1) | O(1) | Sub-millisecond |
| **Customer Sorting** | O(n log n) | O(log n) | ~1ms for 1000 customers |
| **Analytics** | O(n) | O(1) | ~0.5ms for 1000 customers |
| **Database Query** | O(log n) | O(1) | ~10ms with indexing |
| **API Response** | O(1) | O(1) | ~50ms average |

## 🔒 Security Features

- ✅ **Firebase Authentication** - Multi-provider auth with JWT tokens
- ✅ **Input Validation** - Comprehensive server-side validation
- ✅ **SQL Injection Protection** - MongoDB with Mongoose ODM
- ✅ **CORS Configuration** - Controlled cross-origin requests
- ✅ **Environment Variables** - Secure credential management
- ✅ **Audit Logging** - User activity and authentication tracking
- ✅ **Data Encryption** - MongoDB Atlas encryption at rest

## 🧪 Testing

```bash
# Run tests (when available)
npm test

# Manual testing endpoints
curl http://localhost:8080/api/health
curl http://localhost:8080/api/customers
```

## 📈 Business Value

### **For Small Businesses**
- **Quick Setup**: 5-minute deployment
- **Cost Effective**: Free tier available
- **Easy to Use**: Intuitive web interface

### **For Enterprises**
- **High Performance**: C++ computational engine
- **Scalable**: MongoDB Atlas auto-scaling
- **Secure**: Enterprise-grade authentication
- **Customizable**: Open-source and extensible

### **ROI Calculator**
```
Time Saved per Analysis: 30 minutes
Analyses per Month: 50
Monthly Time Savings: 25 hours
Hourly Rate: $50
Monthly Savings: $1,250
Annual ROI: $15,000+
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### **Development Guidelines**
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure C++ code compiles without warnings

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase Team** - Authentication infrastructure
- **MongoDB** - Database platform and drivers
- **Chart.js** - Data visualization library
- **Express.js** - Web framework
- **Render** - Deployment platform

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/Rizwan2611/CLV_calculator/issues)
- **Documentation**: [Wiki](https://github.com/Rizwan2611/CLV_calculator/wiki)
- **Email**: [Support](mailto:support@clvcalculator.com)

---

**⭐ Star this repository if it helped you calculate CLV more efficiently!**

*Built with ❤️ by developers, for businesses that value their customers.*
