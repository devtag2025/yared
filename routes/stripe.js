const axios = require('axios');
const router = require('express').Router();


router.get('/payment-success', async (req, res) => {
    const { session_id } = req.query;

    try {
        // 1. Forward the request to Make
        const makeResponse = await axios.post('https://hook.eu2.make.com/ae1wkuos2utb4phsggc3c8ttvuvy96fc', {
            sessionId: session_id
        });

        // 2. Log for debugging
        console.log("Response from Make:", makeResponse.data);

        // 3. Send Make's response ('Accepted') directly back to the client
        // This stops any redirection and just returns the raw data.
        return res.status(200).send(makeResponse.data);

    } catch (error) {
        console.error("Error in Success Proxy:", error.message);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
