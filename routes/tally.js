const axios = require('axios');
const router = require('express').Router();

// CHANGED: Now listening for GET requests (Browser Redirects)
router.get('/tally-submit', async (req, res) => {
    try {
        // 1. "Mask" the data: Convert GET Query Params into the JSON Body Make expects
        // This allows your existing Make scenario to keep working without changes.
        const payload = {
            data: {
                // Tally passes params like ?email=...&name=...
                // We wrap them in a 'fields' array or pass them directly depending on your Make setup.
                // Simplest approach: Pass all query params as the data object.
                ...req.query 
            }
        };

        // 2. Forward to Make (Scenario 8141716)
        // We still use POST to Make because your Make webhook expects data in the body.
        const makeResponse = await axios.post(
            'https://hook.eu2.make.com/1venloszyqu0nvf9w5xuqktp8w6l95op', 
            payload,
            { timeout: 60000 }
        );

        // 3. Return the HTML Redirect Page from Make
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(makeResponse.data);

    } catch (error) {
        console.error("Error in Tally Proxy:", error.message);
        res.status(500).send("Internal Server Error: " + error.message);
    }
});

module.exports = router;