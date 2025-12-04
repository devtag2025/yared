const axios = require('axios');
const JobOffer = require('../models/jobOffer');
const { MAKE_WEBHOOK_URL } = require('../config');

/**
 * Expiry Cron Job
 * Runs every minute to check for pending jobs that passed their expiry time
 * Note: MongoDB TTL will auto-delete, but we still need to trigger webhooks
 */
const startExpiryJob = () => {
    setInterval(async () => {
        try {
            const now = new Date();
            console.log('[CRON] Checking for expired links...');
            
            const expiredJobs = await JobOffer.find({
                status: 'pending',
                expiresAt: { $lt: now }
            });

            for (const job of expiredJobs) {
                console.log(`[EXPIRY] Marking token ${job.token} as expired.`);
                
                job.status = 'expired';
                job.respondedAt = now;
                await job.save();

                // Notify Make.com
                try {
                    await axios.post(MAKE_WEBHOOK_URL, {
                        event: 'offer_expired',
                        token: job.token,
                        job_id: job.jobDetails.id,
                        cleaner_id: job.cleanerId,
                        timestamp: now.toISOString()
                    });
                } catch (err) {
                    console.error(`[CRON] Failed to notify Make.com for ${job.token}: ${err.message}`);
                }
            }

            if (expiredJobs.length > 0) {
                console.log(`[CRON] Processed ${expiredJobs.length} expired offers`);
            }
        } catch (error) {
            console.error('[CRON ERROR]', error);
        }
    }, 60 * 1000); // Run every 60 seconds
};

module.exports = { startExpiryJob };
