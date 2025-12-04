const mongoose = require('mongoose');
const config = require('../config');

let cached = global.__mongoose_cache || (global.__mongoose_cache = { conn: null, promise: null });

async function connect() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(config.MONGODB_URI, {
            // Recommended options - keep minimal for mongoose v6+/v7+
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        }).then(m => m.connection);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = { connect };
