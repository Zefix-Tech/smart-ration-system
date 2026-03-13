const express = require('express');
const router = express.Router();
const { getCurrentMonthUsage } = require('../controllers/adminAnalyticsController');
const { auth } = require('../middleware/auth');

router.get('/analytics/current-month-usage', auth, getCurrentMonthUsage);

module.exports = router;
