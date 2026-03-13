const Shop = require('../models/Shop');
const Stock = require('../models/Stock');

/**
 * Deducts stock from both the Shop model and the central/shop Stock records.
 * @param {string} shopId - The ID of the shop.
 * @param {Array} items - Array of { commodity, quantity } objects.
 */
const deductStock = async (shopId, items) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // 1. Update Shop model (Local Stock)
    const shop = await Shop.findById(shopId);
    if (!shop) throw new Error('Shop not found');

    for (const item of items) {
        if (shop.stock[item.commodity] !== undefined) {
            shop.stock[item.commodity] -= item.quantity;
        }

        // 2. Update Shop-Specific Stock record (for Admin Reports/Visibility)
        let shopStock = await Stock.findOne({ shop: shopId, commodity: item.commodity, month, year });
        if (shopStock) {
            shopStock.distributed += item.quantity;
            shopStock.remaining = Math.max(0, shopStock.remaining - item.quantity);
            shopStock.lastUpdated = now;
            await shopStock.save();
        } else {
            // Create one if it doesn't exist (though it should be seeded)
            await Stock.create({
                shop: shopId,
                commodity: item.commodity,
                totalQuantity: item.quantity,
                distributed: item.quantity,
                remaining: 0,
                month,
                year,
                lastUpdated: now
            });
        }

        // 3. Update Central Stock record (shop: null) (for Dashboard Summary)
        let centralStock = await Stock.findOne({ shop: null, commodity: item.commodity, month, year });
        if (centralStock) {
            centralStock.distributed += item.quantity;
            centralStock.remaining = Math.max(0, centralStock.remaining - item.quantity);
            centralStock.lastUpdated = now;
            await centralStock.save();
        }
    }

    await shop.save();
};

module.exports = { deductStock };
