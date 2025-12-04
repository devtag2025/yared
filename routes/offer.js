const axios = require('axios');
const JobOffer = require('../models/jobOffer');
const { MAKE_WEBHOOK_URL } = require('../config');
const { renderOfferPage } = require('../lib/renderOfferPage');

/**
 * 2. Serve Offer Page (Called by Cleaner's Browser)
 */
const router = require('express').Router();

router.get('/offer/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const job = await JobOffer.findOne({ token });

        if (!job) {
            return res.status(404).send('<h1>Link Invalid</h1><p>This job offer link could not be found.</p>');
        }

        // Auto-check expiry on visit
        if (job.status === 'pending' && new Date() > new Date(job.expiresAt)) {
            job.status = 'expired';
            await job.save();
            
            // Trigger webhook immediately
            axios.post(MAKE_WEBHOOK_URL, {
                event: 'offer_expired',
                token: token,
                job_id: job.jobDetails.id,
                cleaner_id: job.cleanerId,
                timestamp: new Date().toISOString()
            }).catch(err => console.error("Webhook failed:", err.message));
        }

        const html = renderOfferPage(job, token);
        res.send(html);
    } catch (error) {
        console.error('[OFFER PAGE ERROR]', error);
        res.status(500).send('<h1>Error</h1><p>Unable to load offer page.</p>');
    }
});

module.exports = router;
