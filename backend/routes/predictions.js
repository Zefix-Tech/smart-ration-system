const express = require('express');
const router = express.Router();

// AI Stock Predictions (simulated ML results)
router.get('/', async (req, res) => {
    try {
        const predictions = {
            rice: {
                currentMonth: 45000,
                nextMonth: 48500,
                trend: 'increasing',
                confidence: 92,
                history: [
                    { month: 'Oct', actual: 42000, predicted: 41500 },
                    { month: 'Nov', actual: 43500, predicted: 43000 },
                    { month: 'Dec', actual: 44000, predicted: 44200 },
                    { month: 'Jan', actual: 44800, predicted: 45000 },
                    { month: 'Feb', actual: 45000, predicted: 45200 },
                    { month: 'Mar', actual: null, predicted: 48500 }
                ]
            },
            sugar: {
                currentMonth: 12000,
                nextMonth: 11500,
                trend: 'stable',
                confidence: 88,
                history: [
                    { month: 'Oct', actual: 11800, predicted: 11500 },
                    { month: 'Nov', actual: 12000, predicted: 11900 },
                    { month: 'Dec', actual: 12200, predicted: 12100 },
                    { month: 'Jan', actual: 12100, predicted: 12000 },
                    { month: 'Feb', actual: 12000, predicted: 12050 },
                    { month: 'Mar', actual: null, predicted: 11500 }
                ]
            },
            wheat: {
                currentMonth: 32000,
                nextMonth: 34000,
                trend: 'increasing',
                confidence: 85,
                history: [
                    { month: 'Oct', actual: 30000, predicted: 29800 },
                    { month: 'Nov', actual: 31000, predicted: 30500 },
                    { month: 'Dec', actual: 31500, predicted: 31800 },
                    { month: 'Jan', actual: 32000, predicted: 31500 },
                    { month: 'Feb', actual: 32000, predicted: 32200 },
                    { month: 'Mar', actual: null, predicted: 34000 }
                ]
            }
        };
        res.json(predictions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
