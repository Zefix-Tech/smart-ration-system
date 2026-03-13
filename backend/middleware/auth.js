const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

const superAdminOnly = (req, res, next) => {
    if (req.admin.role !== 'superadmin') {
        return res.status(403).json({ message: 'Super Admin access required.' });
    }
    next();
};

module.exports = { auth, superAdminOnly };
