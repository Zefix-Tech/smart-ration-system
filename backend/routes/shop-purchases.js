const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Shop = require('../models/Shop');

// Get purchase requests for a shop
router.get('/:shopId', async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const orders = await Order.find({ shop: req.params.shopId, status })
            .populate('user', 'name phone rationCard category')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const { deductStock } = require('../utils/stockUtils');

// Update order status (Approve/Reject/Complete)
router.patch('/update/:orderId', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.orderId).populate('shop');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (status === 'completed' && order.status !== 'completed') {
            // Deduct stock using central utility
            await deductStock(order.shop._id, order.items);

            // Update user last purchase date
            await User.findByIdAndUpdate(order.user, { lastPurchaseDate: new Date() });
        }

        order.status = status;
        await order.save();

        res.json({ message: `Order marked as ${status}`, order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
