require('dotenv').config();

const cron = require('node-cron');
const axios = require('axios');
const JobOffer = require('../models/jobOffer');
const { connect } = require('../lib/mongoose');
const config = require('../config');

// Initialize MongoDB connection
let isConnected = false;

async function initDB() {
    try {
        await connect();
        isConnected = true;
        console.log('✅ Cron Service: MongoDB Connected');
    } catch (err) {
        console.error('❌ Cron Service: MongoDB Connection Error:', err);
        process.exit(1);
    }
}

/**
 * Check for expired job offers every minute
 * Runs at: every minute (* * * * *)
 */
function startExpiryChecker() {
    cron.schedule('* * * * *', async () => {
        if (!isConnected) return;

        try {
            const now = new Date();
            console.log(`[${now.toISOString()}] [CRON] Checking for expired offers...`);

            const expiredJobs = await JobOffer.find({
                status: 'pending',
                expiresAt: { $lt: now }
            });

            if (expiredJobs.length === 0) {
                console.log('[CRON] No expired offers found.');
                return;
            }

            console.log(`[CRON] Found ${expiredJobs.length} expired offers. Processing...`);

            for (const job of expiredJobs) {
                try {
                    job.status = 'expired';
                    job.respondedAt = now;
                    await job.save();

                    console.log(`[CRON] Marked job ${job.jobDetails.id} (token: ${job.token}) as expired.`);

                    // Notify Make.com webhook
                    try {
                        await axios.post(config.MAKE_WEBHOOK_URL, {
                            event: 'offer_expired',
                            token: job.token,
                            job_id: job.jobDetails.id,
                            cleaner_id: job.cleanerId,
                            cleaner_name: job.cleanerName,
                            timestamp: now.toISOString()
                        }, { timeout: 5000 });

                        console.log(`[CRON] Webhook sent for token ${job.token}`);
                    } catch (webhookErr) {
                        console.error(`[CRON] Webhook failed for token ${job.token}:`, webhookErr.message);
                    }
                } catch (jobErr) {
                    console.error(`[CRON] Error processing job ${job._id}:`, jobErr.message);
                }
            }

            console.log(`[CRON] Completed. Processed ${expiredJobs.length} offers.`);
        } catch (err) {
            console.error('[CRON ERROR]', err.message);
        }
    });

    console.log('🕐 Expiry checker cron scheduled (every minute).');
}

/**
 * Cleanup old expired/completed offers every hour
 * Runs at: every hour at minute 0 (* 0 * * *)
 * (Optional: comment out if not needed)
 */
function startCleanupJob() {
    cron.schedule('0 * * * *', async () => {
        if (!isConnected) return;

        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            console.log(`[${now.toISOString()}] [CLEANUP] Removing old expired offers...`);

            const result = await JobOffer.deleteMany({
                status: { $in: ['expired', 'accepted', 'declined'] },
                respondedAt: { $lt: thirtyDaysAgo }
            });

            if (result.deletedCount > 0) {
                console.log(`[CLEANUP] Deleted ${result.deletedCount} old offers.`);
            }
        } catch (err) {
            console.error('[CLEANUP ERROR]', err.message);
        }
    });

    console.log('🧹 Cleanup job scheduled (hourly).');
}

async function start() {
    console.log('🚀 Starting Cron Service...');
    await initDB();

    startExpiryChecker();
    startCleanupJob();

    console.log('✅ All cron jobs started. Service is running.');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('\nSIGTERM received. Shutting down cron service...');
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('\nSIGINT received. Shutting down cron service...');
        process.exit(0);
    });
}

if (require.main === module) {
    start();
}

module.exports = { startExpiryChecker, startCleanupJob };
