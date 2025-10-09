const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://rizxx50_db_user:P3VywhlQkN49ZWIf@clv.llk5c76.mongodb.net/CLV_Calculator?retryWrites=true&w=majority';
            
            console.log('Connecting to MongoDB...');
            
            this.connection = await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
                socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            });

            console.log('✅ MongoDB connected successfully');
            console.log(`📊 Database: ${this.connection.connection.name}`);
            
            return this.connection;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.connection) {
                await mongoose.disconnect();
                console.log('📴 MongoDB disconnected');
            }
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error.message);
        }
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }

    getConnection() {
        return this.connection;
    }
}

module.exports = new Database();
