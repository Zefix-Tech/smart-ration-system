const express = require('express');
const router = express.Router();
const DeliveryRequest = require('../models/DeliveryRequest');
const User = require('../models/User');
const Order = require('../models/Order');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');

// Get delivery requests for a shop
router.get('/:shopId', async (req, res) => {
    try {
        const requests = await DeliveryRequest.find({ shop: req.params.shopId })
            .populate('user', 'name phone rationCard address category')
            .populate('order', 'items status')
            .populate('deliveredBy', 'name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update delivery status (approve/reject)
router.patch('/update/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const request = await DeliveryRequest.findByIdAndUpdate(req.params.id, { status, reviewedAt: new Date() }, { new: true }).populate('user', 'name phone');
        
        if (status === 'approved' && request.shop) {
            // Find all deliverymen for this shop
            const deliverymen = await Admin.find({ shop: request.shop, role: 'deliveryman' });
            const deliverymanIds = deliverymen.map(d => d._id);

            if (deliverymanIds.length > 0) {
                const notification = new Notification({
                    title: 'New Delivery Assigned',
                    message: `A new delivery request for ${request.user?.name} has been approved and is ready for dispatch.`,
                    type: 'alert',
                    targetAudience: 'specific',
                    recipients: deliverymanIds
                });
                await notification.save();
            }
        }
        
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Dispatch delivery & generate OTP (shop admin action)
router.post('/dispatch/:id', async (req, res) => {
    try {
        const delivery = await DeliveryRequest.findById(req.params.id).populate('user', 'name phone');
        if (!delivery) return res.status(404).json({ message: 'Delivery request not found' });
        if (delivery.status !== 'approved') return res.status(400).json({ message: 'Delivery must be approved before dispatching' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

        delivery.otp = otp;
        delivery.otpExpiry = otpExpiry;
        delivery.status = 'dispatched';
        await delivery.save();

        // In production: send SMS — for dev, log to console
        console.log(`📱 OTP for ${delivery.user?.name} (${delivery.user?.phone}): ${otp}`);

        res.json({
            message: 'OTP generated and dispatched',
            otp, // Return OTP in response for testing (remove in production)
            phone: delivery.user?.phone
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify OTP (delivery person action)
router.post('/verify-otp/:id', async (req, res) => {
    try {
        const { otp, deliveryPersonId } = req.body;
        const delivery = await DeliveryRequest.findById(req.params.id).populate('user', 'name phone rationCard');
        if (!delivery) return res.status(404).json({ message: 'Delivery request not found' });

        if (delivery.status === 'delivered') return res.status(400).json({ message: 'Delivery already completed' });
        if (delivery.status !== 'dispatched') return res.status(400).json({ message: 'Delivery has not been dispatched yet' });
        if (!delivery.otp) return res.status(400).json({ message: 'No OTP generated. Please dispatch first.' });
        if (new Date() > delivery.otpExpiry) return res.status(400).json({ message: 'OTP has expired. Please re-dispatch.' });
        if (delivery.otp !== otp.trim()) return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });

        // Mark as delivered
        delivery.status = 'delivered';
        delivery.deliveredBy = deliveryPersonId || null;
        delivery.otp = null;
        delivery.otpExpiry = null;
        delivery.reviewedAt = new Date();
        await delivery.save();

        // If there's a linked order, mark it completed and reduce stock
        if (delivery.order) {
            const order = await Order.findById(delivery.order);
            if (order && order.status !== 'completed') {
                const { deductStock } = require('../utils/stockUtils');
                // Deduct stock using central utility
                await deductStock(delivery.shop, order.items);
                
                // Mark order as completed
                order.status = 'completed';
                order.deliveredBy = deliveryPersonId || null;
                await order.save();
            }
        }

        // Update user's last purchase date
        await User.findByIdAndUpdate(delivery.user._id, { lastPurchaseDate: new Date() });

        res.json({
            message: 'Delivery verified successfully!',
            delivery
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
