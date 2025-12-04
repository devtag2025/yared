const crypto = require('crypto');
const config = require('../config');

function isValidSignature(req) {
    const signature = req.headers['x-signature'];
    if (!signature) return false;

    // Make sure body is a string (should be parsed by Vercel but stringify for HMAC)
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const expected = crypto.createHmac('sha256', config.SHARED_SECRET).update(payload).digest('hex');
    return signature === expected;
}

module.exports = { isValidSignature };
