const JobOffer = require('../../models/jobOffer');
const { renderOfferPage } = require('../../lib/renderOfferPage');
const { connect } = require('../../lib/mongoose');
const axios = require('axios');
const config = require('../../config');

module.exports = async (req, res) => {
    try {
        if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

        await connect();

        const { token } = req.query || {};
        if (!token) return res.status(400).send('<h1>Bad Request</h1>');

        const job = await JobOffer.findOne({ token });
        if (!job) return res.status(404).send('<h1>Link Invalid</h1><p>This job offer link could not be found.</p>');

        if (job.status === 'pending' && new Date() > new Date(job.expiresAt)) {
            job.status = 'expired';
            await job.save();

            axios.post(config.MAKE_WEBHOOK_URL, {
                event: 'offer_expired',
                token: token,
                job_id: job.jobDetails.id,
                cleaner_id: job.cleanerId,
                timestamp: new Date().toISOString()
            }).catch(err => console.error("Webhook failed:", err.message));
        }

        const html = renderOfferPage(job, token);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('[API offer page] ', err);
        res.status(500).send('<h1>Error</h1><p>Unable to load offer page.</p>');
    }
};
