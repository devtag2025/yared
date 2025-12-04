const { v4: uuidv4 } = require('uuid');
const JobOffer = require('../models/jobOffer');
const { BASE_URL, DEFAULT_EXPIRY_MINUTES } = require('../config');
const { verifySignature } = require('../middleware/verifySignature');

/**
 * 1. Generate Link Endpoint (Called by Make.com)
 * Input: { cleaner_id, cleaner_name, job_id, job_details: {...}, expiry_minutes? }
 */
const router = require('express').Router();

router.post('/generate-link', verifySignature, async (req, res) => {
    try {
        const { cleaner_id, cleaner_name, job_id, job_details, expiry_minutes } = req.body;

        if (!cleaner_id || !job_id) {
            return res.status(400).json({ error: 'Missing cleaner_id or job_id' });
        }

        const token = uuidv4();
        const duration = expiry_minutes || DEFAULT_EXPIRY_MINUTES;
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

        console.log(`[LINK GEN] Generated token ${token} for Cleaner ${cleaner_id}`);

        res.json({
            success: true,
            link: `${BASE_URL}/offer/${token}`,
            expires_at: expiresAt.toISOString(),
            token
        });
    } catch (error) {
        console.error('[LINK GEN ERROR]', error);
        res.status(500).json({ error: 'Failed to generate link', details: error.message });
    }
});

module.exports = router;
