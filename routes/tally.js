const axios = require('axios');
const router = require('express').Router();

router.post('/tally-submit', async (req, res) => {
    try {
        // 1. Forward the Tally data to Make.com
        const makeResponse = await axios.post(
            'https://hook.eu2.make.com/1venloszyqu0nvf9w5xuqktp8w6l95op', 
            req.body,
            { timeout: 60000 } // Account for the 'Sleep' module in the flow
        );

        // 2. Log the response to confirm it's the HTML page
        console.log("Response from Make received (HTML detected)");

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(makeResponse.data);

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return res.status(504).send("The automation took too long to respond.");
        }
        console.error("Error in Tally Proxy:", error.message);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;