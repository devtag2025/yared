require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Import config
const config = require('./config');

// Import models
const JobOffer = require('./models/jobOffer');

// Import middleware
const { verifySignature } = require('./middleware/verifySignature');

// Import routes
const generateLinkRoutes = require('./routes/generateLink');
const offerRoutes = require('./routes/offer');
const respondRoutes = require('./routes/respond');
const expireJobRoutes = require('./routes/expireJob');

// Import services
const { startExpiryJob } = require('./services/expiryJob');

const app = express();

// --- MIDDLEWARE ---
app.use(bodyParser.json());

// --- MONGODB CONNECTION ---
mongoose.connect(config.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

// --- ROUTE HANDLERS ---
app.use('/api', generateLinkRoutes);
app.use('/', offerRoutes);
app.use('/api', respondRoutes);
app.use('/api', expireJobRoutes);

// --- HEALTH CHECK ENDPOINT ---
app.get('/health', async (req, res) => {
    try {
        // Check MongoDB connection
        const dbState = mongoose.connection.readyState;
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        
        res.json({
            status: dbState === 1 ? 'healthy' : 'unhealthy',
            database: states[dbState],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// --- START CRON JOB ---
// Don't start background cron in serverless environment. Keep for local dev optionally.
// startExpiryJob();

// --- GRACEFUL SHUTDOWN ---
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing MongoDB connection...');
    await mongoose.connection.close();
    process.exit(0);
});

// --- START SERVER ---
if (require.main === module) {
    // Running directly (local dev)
    app.listen(config.PORT, () => {
        console.log(`🚀 Job Offer Backend running on http://localhost:${config.PORT}`);
        console.log(`📊 MongoDB URI: ${config.MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')}`); // Hide credentials in logs
        console.log(`🔐 Configured Secret: ${config.SHARED_SECRET.substring(0, 5)}...`);
    });
}

module.exports = app;
