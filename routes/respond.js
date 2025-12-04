const axios = require('axios');
const JobOffer = require('../models/jobOffer');
const { MAKE_WEBHOOK_URL } = require('../config');

/**
 * 3. Handle Accept/Decline (Called by Offer Page JS)
 * Input: { token, action: 'accept' | 'decline' }
 */
const router = require('express').Router();

router.post('/respond', async (req, res) => {
    try {
        const { token, action } = req.body;

        if (!token || !action) {
            return res.status(400).json({ error: 'Missing token or action' });
        }

        if (action !== 'accept' && action !== 'decline') {
            return res.status(400).json({ error: 'Invalid action. Must be "accept" or "decline"' });
        }

        const job = await JobOffer.findOne({ token });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        if (job.status !== 'pending') {
            return res.status(400).json({ error: 'Job is no longer pending' });
        }

        if (new Date() > new Date(job.expiresAt)) {
            job.status = 'expired';
            await job.save();
            return res.status(400).json({ error: 'Offer has expired' });
        }

        // Update Status
        job.status = action === 'accept' ? 'accepted' : 'declined';
        job.respondedAt = new Date();
        await job.save();

        console.log(`[RESPONSE] Job ${job.jobDetails.id} was ${job.status} by ${job.cleanerName}`);

        // Trigger Make.com Webhook (non-blocking)
        axios.post(MAKE_WEBHOOK_URL, {
            event: `offer_${job.status}`,
            token: token,
            job_id: job.jobDetails.id,
            cleaner_id: job.cleanerId,
            cleaner_name: job.cleanerName,
            timestamp: new Date().toISOString()
        }).catch(err => console.error("Make webhook failed:", err.message));

        res.json({ success: true, status: job.status });
    } catch (error) {
        console.error('[RESPOND ERROR]', error);
        res.status(500).json({ error: 'Failed to process response', details: error.message });
    }
});

module.exports = router;
