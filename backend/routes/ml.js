const express = require('express');
const router = express.Router();

const ML_SERVER_URL = 'http://localhost:6000';

// Predict Stock Demand
router.post('/predict-stock', async (req, res) => {
    try {
        const { users } = req.body;
        if (!users) {
            return res.status(400).json({ success: false, message: 'Number of users is required' });
        }

        const response = await fetch(`${ML_SERVER_URL}/predict-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users })
        });
        
        if (!response.ok) {
            throw new Error(`ML Service responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json({ success: true, data });
    } catch (err) {
        console.warn('⚠️  ML Service stock prediction not reachable (localhost:6000). Start ml-service/app.py to enable.');
        res.status(500).json({ success: false, message: 'Failed to fetch prediction from ML Service', error: err.message });
    }
});

// Detect Fraud
router.post('/detect-fraud', async (req, res) => {
    try {
        const { user_requests, duplicate_attempt } = req.body;
        if (user_requests === undefined || duplicate_attempt === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields for fraud detection' });
        }

        const response = await fetch(`${ML_SERVER_URL}/detect-fraud`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_requests, duplicate_attempt })
        });
        
        if (!response.ok) {
            throw new Error(`ML Service responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json({ success: true, data });
    } catch (err) {
        console.warn('⚠️  ML Service fraud detection not reachable (localhost:6000). Start ml-service/app.py to enable.');
        res.status(500).json({ success: false, message: 'Failed to access ML fraud detection', error: err.message });
    }
});

// Usage Pattern
router.get('/usage-pattern', async (req, res) => {
    try {
        const response = await fetch(`${ML_SERVER_URL}/usage-pattern`);
        
        if (!response.ok) {
            throw new Error(`ML Service responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json({ success: true, data });
    } catch (err) {
        console.warn('⚠️  ML Service usage pattern not reachable (localhost:6000). Start ml-service/app.py to enable.');
        res.status(500).json({ success: false, message: 'Failed to fetch usage pattern from ML Service', error: err.message });
    }
});

module.exports = router;
