require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Import database and routes
const database = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
async function initializeDatabase() {
    try {
        await database.connect();
        console.log('🚀 Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.log('⚠️  Server will continue without database connection');
    }
}

// Initialize database connection
initializeDatabase();

// API Routes
app.use('/api', apiRoutes);

// Serve static files from dist directory (built files) in production, Frontend in development
const staticDir = process.env.NODE_ENV === 'production' ? 'dist' : 'Frontend';
app.use(express.static(path.join(__dirname, staticDir), {
    extensions: ['html', 'htm'],
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Handle SPA routing - serve index.html for non-API routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, staticDir, 'index.html'));
});

// Catch-all handler for non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
    const filePath = path.join(__dirname, staticDir, req.path);
    
    // If file exists, serve it
    if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
        return res.sendFile(filePath);
    }
    
    // Otherwise serve index.html for SPA routing
    res.sendFile(path.join(__dirname, staticDir, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'Frontend')}`);
    console.log(`📊 Database: ${database.isConnected() ? '✅ Connected' : '❌ Disconnected'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    await database.disconnect();
    server.close(() => {
        console.log('💤 Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    await database.disconnect();
    server.close(() => {
        console.log('💤 Process terminated');
        process.exit(0);
    });
});
