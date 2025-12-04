const JobOffer = require('../models/jobOffer');
const config = require('../config');
const { connect } = require('../lib/mongoose');
const axios = require('axios');

module.exports = async (req, res) => {
    try {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

        await connect();

        const { token, action } = req.body || {};
        if (!token || !action) return res.status(400).json({ error: 'Missing token or action' });
        if (!['accept', 'decline'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

        const job = await JobOffer.findOne({ token });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.status !== 'pending') return res.status(400).json({ error: 'Job is no longer pending' });
        if (new Date() > new Date(job.expiresAt)) {
            job.status = 'expired';
            await job.save();
            return res.status(400).json({ error: 'Offer has expired' });
        }

        job.status = action === 'accept' ? 'accepted' : 'declined';
        job.respondedAt = new Date();
        await job.save();

        // Notify Make.com asynchronously
        axios.post(config.MAKE_WEBHOOK_URL, {
            event: `offer_${job.status}`,
            token: token,
            job_id: job.jobDetails.id,
            cleaner_id: job.cleanerId,
            cleaner_name: job.cleanerName,
            timestamp: new Date().toISOString()
        }).catch(err => console.error('[respond webhook error]', err.message));

        res.json({ success: true, status: job.status });
    } catch (err) {
        console.error('[API respond] ', err);
        res.status(500).json({ error: err.message });
    }
};
