const Stock = require('../models/Stock');

exports.getCurrentMonthUsage = async (req, res) => {
    try {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        // Stock model stores monthly totals for each commodity
        const records = await Stock.find({
            month: month,
            year: year
        });

        let rice = 0;
        let wheat = 0;
        let sugar = 0;

        records.forEach(r => {
            if (r.commodity === 'rice') rice += r.distributed || 0;
            if (r.commodity === 'wheat') wheat += r.distributed || 0;
            if (r.commodity === 'sugar') sugar += r.distributed || 0;
        });

        res.json({
            rice,
            wheat,
            sugar
        });
    } catch (error) {
        console.error('Usage Analytics Error:', error);
        res.status(500).json({ message: "Server error" });
    }
};
