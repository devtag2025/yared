const crypto = require('crypto');
const { SHARED_SECRET } = require('../config');

/**
 * Verify HMAC Signature from Make.com
 */
const verifySignature = (req, res, next) => {
    const signature = req.headers['x-signature'];
    
    if (!signature) {
        console.warn('⚠️ Warning: No X-Signature header provided.');
        return next();
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha256', SHARED_SECRET)
        .update(payload)
        .digest('hex');

    if (signature === expectedSignature) {
        next();
    } else {
        res.status(401).json({ error: 'Invalid HMAC signature' });
    }
};

module.exports = { verifySignature };
