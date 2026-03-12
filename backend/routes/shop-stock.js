const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Stock = require('../models/Stock');

// Get current shop stock (from Shop model)
router.get('/current/:shopId', async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop.stock);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update shop stock
router.patch('/update/:shopId', async (req, res) => {
    try {
        const { rice, wheat, sugar, kerosene } = req.body;
        const shop = await Shop.findById(req.params.shopId);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        if (rice !== undefined) shop.stock.rice = rice;
        if (wheat !== undefined) shop.stock.wheat = wheat;
        if (sugar !== undefined) shop.stock.sugar = sugar;
        if (kerosene !== undefined) shop.stock.kerosene = kerosene;

        await shop.save();

        // Also create/update a Stock record for history
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        for (const [commodity, qty] of Object.entries(req.body)) {
             await Stock.findOneAndUpdate(
                 { shop: shop._id, commodity, month, year },
                 { 
                     $set: { totalQuantity: qty, remaining: qty, lastUpdated: now },
                     $setOnInsert: { distributed: 0 }
                 },
                 { upsert: true, new: true }
             );
        }

        res.json({ message: 'Stock updated successfully', stock: shop.stock });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get stock history for a shop
router.get('/history/:shopId', async (req, res) => {
    try {
        const history = await Stock.find({ shop: req.params.shopId }).sort({ year: -1, month: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
