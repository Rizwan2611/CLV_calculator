const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'API is running',
        database: require('../config/database').isConnected() ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Get all customers
router.get('/customers', async (req, res) => {
    try {
        const { userId, limit = 50, page = 1 } = req.query;
        
        let query = {};
        if (userId) {
            query.userId = userId;
        }

        const customers = await Customer.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Customer.countDocuments(query);

        res.json({
            status: 'success',
            customers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch customers',
            error: error.message
        });
    }
});

// Add a new customer
router.get('/add-customer', async (req, res) => {
    try {
        const { id, name, averagePurchaseValue, purchaseFrequency, customerLifespan, userId } = req.query;

        // Validation
        if (!id || !name || !averagePurchaseValue || !purchaseFrequency || !customerLifespan) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: id, name, averagePurchaseValue, purchaseFrequency, customerLifespan'
            });
        }

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ id });
        if (existingCustomer) {
            return res.status(409).json({
                status: 'error',
                message: `Customer with ID '${id}' already exists`
            });
        }

        // Create new customer
        const customerData = {
            id,
            name,
            averagePurchaseValue: parseFloat(averagePurchaseValue),
            purchaseFrequency: parseFloat(purchaseFrequency),
            customerLifespan: parseFloat(customerLifespan),
            userId: userId || null,
            metadata: {
                source: 'web_app',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        };

        const customer = new Customer(customerData);
        await customer.save();

        console.log(`✅ Customer added: ${customer.name} (ID: ${customer.id})`);

        res.json({
            status: 'success',
            message: `Customer '${customer.name}' added successfully`,
            customer: {
                id: customer.id,
                name: customer.name,
                clv: customer.clv,
                createdAt: customer.createdAt
            }
        });
    } catch (error) {
        console.error('Error adding customer:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add customer',
            error: error.message
        });
    }
});

// Update customer
router.put('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const customer = await Customer.findOneAndUpdate(
            { id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Customer updated successfully',
            customer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update customer',
            error: error.message
        });
    }
});

// Delete customer
router.delete('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findOneAndDelete({ id });

        if (!customer) {
            return res.status(404).json({
                status: 'error',
                message: 'Customer not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete customer',
            error: error.message
        });
    }
});

// Get analytics
router.get('/analytics', async (req, res) => {
    try {
        const { userId } = req.query;
        
        let query = {};
        if (userId) {
            query.userId = userId;
        }

        const analytics = await Customer.getAnalytics();

        res.json({
            status: 'success',
            analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
});

// Get user analytics
router.get('/user-analytics', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                status: 'error',
                message: 'userId is required'
            });
        }

        const userCustomers = await Customer.find({ userId });
        const totalCLV = userCustomers.reduce((sum, customer) => sum + customer.clv, 0);
        const avgCLV = userCustomers.length > 0 ? totalCLV / userCustomers.length : 0;

        res.json({
            status: 'success',
            analytics: {
                totalCustomers: userCustomers.length,
                totalCLV,
                averageCLV: avgCLV,
                customers: userCustomers
            }
        });
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user analytics',
            error: error.message
        });
    }
});

module.exports = router;
