const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const axios = require('axios');

// GET /api/admin/ai-stock-prediction
router.get('/', async (req, res) => {
    try {
        // Find total users served to feed into the prediction model
        const shops = await Shop.find({});
        const totalUsers = shops.reduce((sum, shop) => sum + (shop.usersServed || 0), 0);
        
        // Fetch from ML Microservice Python App
        let mlResponse;
        try {
            // The flask app requires 'users' field instead of a complex array history
            const response = await axios.post("http://localhost:6000/predict-stock", {
                users: totalUsers > 0 ? totalUsers : 150 // fallback to 150 users for a baseline prediction
            });
            mlResponse = response.data;
        } catch (mlErr) {
            console.warn("⚠️  ML service not reachable (localhost:6000) — using fallback predictions. Start ml-service/app.py to enable AI predictions.");
            // Fallback object so the dashboard doesn't crash if the flask app goes down
            mlResponse = {
                predicted_rice_demand: 8200,
                predicted_wheat_demand: 4100,
                predicted_sugar_demand: 1900
            };
        }
        
        // Map the python response keys correctly to what the frontend expects
        res.json({
            rice_prediction: mlResponse.predicted_rice_demand,
            wheat_prediction: mlResponse.predicted_wheat_demand,
            sugar_prediction: mlResponse.predicted_sugar_demand
        });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
