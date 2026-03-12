const AuditLog = require('../models/AuditLog');

const logAudit = (action, module) => {
    return async (req, res, next) => {
        // We only log if the request was successful
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    await AuditLog.create({
                        admin: req.admin?.id || req.admin?._id,
                        action,
                        module,
                        details: JSON.stringify(req.body || {}),
                        ipAddress: req.ip || req.connection.remoteAddress
                    });
                } catch (err) {
                    console.error('Audit Logging Error:', err);
                }
            }
        });
        next();
    };
};

module.exports = { logAudit };
