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

// Update order status (Approve/Reject/Complete)
router.patch('/update/:orderId', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.orderId).populate('shop');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (status === 'completed' && order.status !== 'completed') {
            // Reduce stock automatically
            const shop = await Shop.findById(order.shop._id);
            order.items.forEach(item => {
                if (shop.stock[item.commodity] !== undefined) {
                    shop.stock[item.commodity] -= item.quantity;
                }
            });
            await shop.save();

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
