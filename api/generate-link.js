const { v4: uuidv4 } = require('uuid');
const JobOffer = require('../models/jobOffer');
const config = require('../config');
const { connect } = require('../lib/mongoose');
const { isValidSignature } = require('../lib/verifySignature');

module.exports = async (req, res) => {
    try {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

        // Optional signature validation
        if (!isValidSignature(req)) {
            return res.status(401).json({ error: 'Invalid or missing signature' });
        }

        await connect();

        const { cleaner_id, cleaner_name, job_id, job_details, expiry_minutes } = req.body || {};

        if (!cleaner_id || !job_id) return res.status(400).json({ error: 'Missing cleaner_id or job_id' });

        const token = uuidv4();
        const duration = expiry_minutes || config.DEFAULT_EXPIRY_MINUTES;
        const expiresAt = new Date(Date.now() + duration * 60000);

        const jobOffer = new JobOffer({
            token,
            cleanerId: cleaner_id,
            cleanerName: cleaner_name || 'Unknown',
            jobDetails: {
                id: job_id,
                location: job_details?.location,
                datetime: job_details?.datetime,
                pay: job_details?.pay,
                tasks: job_details?.tasks
            },
            status: 'pending',
            expiresAt
        });

        await jobOffer.save();

        res.json({ success: true, link: `${config.BASE_URL}/offer/${token}`, expires_at: expiresAt.toISOString(), token });
    } catch (err) {
        console.error('[API generate-link] ', err);
        res.status(500).json({ error: err.message });
    }
};
