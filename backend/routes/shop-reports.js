const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Stock = require('../models/Stock');
const DeliveryRequest = require('../models/DeliveryRequest');

// Get shop-specific report data
router.get('/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Distribution by commodity (current month)
        const orders = await Order.find({ shop: shopId, status: 'completed', purchaseDate: { $gte: startOfMonth } });
        const distribution = { rice: 0, wheat: 0, sugar: 0, kerosene: 0 };
        orders.forEach(order => {
            order.items.forEach(item => {
                if (distribution[item.commodity] !== undefined) {
                    distribution[item.commodity] += item.quantity;
                }
            });
        });

        // 2. Weekly stats
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyOrders = await Order.countDocuments({ shop: shopId, status: 'completed', purchaseDate: { $gte: weekAgo } });
        const weeklyDelivery = await DeliveryRequest.countDocuments({ shop: shopId, status: 'delivered', updatedAt: { $gte: weekAgo } });

        res.json({
            distribution,
            stats: {
                monthlyOrders: orders.length,
                weeklyOrders,
                weeklyDelivery
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
