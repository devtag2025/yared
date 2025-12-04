const express = require('express');
const axios = require('axios');
const JobOffer = require('../models/jobOffer');
const { MAKE_WEBHOOK_URL } = require('../config');

const router = express.Router();

// GET /api/cron/check-expiry
router.get('/cron/check-expiry', async (req, res) => {
    try {
        const now = new Date();
        console.log('[CRON] Checking for expired links...');

        const expiredJobs = await JobOffer.find({
            status: 'pending',
            expiresAt: { $lt: now }
        });

        for (const job of expiredJobs) {
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
                console.error(`[CRON] Webhook failed: ${err.message}`);
            }
        }

        res.json({ success: true, expired_count: expiredJobs.length });
    } catch (error) {
        console.error('[CRON ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;