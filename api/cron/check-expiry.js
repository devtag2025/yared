const JobOffer = require('../../../models/jobOffer');
const { connect } = require('../../../lib/mongoose');
const axios = require('axios');
const config = require('../../../config');

module.exports = async (req, res) => {
    try {
        if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

        await connect();
        const now = new Date();
        console.log('[CRON] Checking for expired links...');

        const expiredJobs = await JobOffer.find({ status: 'pending', expiresAt: { $lt: now } });

        for (const job of expiredJobs) {
            job.status = 'expired';
            job.respondedAt = now;
            await job.save();

            try {
                await axios.post(config.MAKE_WEBHOOK_URL, {
                    event: 'offer_expired',
                    token: job.token,
                    job_id: job.jobDetails.id,
                    cleaner_id: job.cleanerId,
                    timestamp: now.toISOString()
                });
            } catch (err) {
                console.error(`[CRON] Failed webhook for ${job.token}:`, err.message);
            }
        }

        res.json({ success: true, expired_count: expiredJobs.length });
    } catch (err) {
        console.error('[API cron] ', err);
        res.status(500).json({ error: err.message });
    }
};
