const { connect } = require('../lib/mongoose');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    try {
        await connect();
        const dbState = mongoose.connection.readyState;
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        res.json({ status: dbState === 1 ? 'healthy' : 'unhealthy', database: states[dbState], timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
};
