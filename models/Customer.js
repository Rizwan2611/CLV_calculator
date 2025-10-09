const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    averagePurchaseValue: {
        type: Number,
        required: true,
        min: 0
    },
    purchaseFrequency: {
        type: Number,
        required: true,
        min: 0
    },
    customerLifespan: {
        type: Number,
        required: true,
        min: 0
    },
    clv: {
        type: Number,
        default: function() {
            return this.averagePurchaseValue * this.purchaseFrequency * this.customerLifespan;
        }
    },
    userId: {
        type: String,
        required: false, // Optional for anonymous users
        trim: true
    },
    metadata: {
        source: {
            type: String,
            default: 'web_app'
        },
        ipAddress: String,
        userAgent: String
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'customers'
});

// Calculate CLV before saving
customerSchema.pre('save', function(next) {
    this.clv = this.averagePurchaseValue * this.purchaseFrequency * this.customerLifespan;
    next();
});

// Instance method to calculate CLV
customerSchema.methods.calculateCLV = function() {
    return this.averagePurchaseValue * this.purchaseFrequency * this.customerLifespan;
};

// Static method to get analytics
customerSchema.statics.getAnalytics = async function() {
    try {
        const totalCustomers = await this.countDocuments();
        const avgCLV = await this.aggregate([
            {
                $group: {
                    _id: null,
                    averageCLV: { $avg: '$clv' },
                    totalCLV: { $sum: '$clv' },
                    maxCLV: { $max: '$clv' },
                    minCLV: { $min: '$clv' }
                }
            }
        ]);

        const recentCustomers = await this.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('id name clv createdAt');

        return {
            totalCustomers,
            analytics: avgCLV[0] || {
                averageCLV: 0,
                totalCLV: 0,
                maxCLV: 0,
                minCLV: 0
            },
            recentCustomers
        };
    } catch (error) {
        throw new Error(`Analytics calculation failed: ${error.message}`);
    }
};

module.exports = mongoose.model('Customer', customerSchema);
