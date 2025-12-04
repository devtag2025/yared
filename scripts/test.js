// test-make.js
const axios = require('axios');
const crypto = require('crypto');

// ⚠️ This must match the default secret in your server.js
const SHARED_SECRET = 'Cleaners_R_Us_Secure_Key_998877'; 
const API_URL = 'http://localhost:3000/api/generate-link';

// 1. Define the simulation data
const payload = {
    cleaner_id: "cleaner_99",
    cleaner_name: "Alex Smith",
    job_id: "job_555",
    expiry_minutes: 15, 
    job_details: {
        location: "42 Wallaby Way, Sydney",
        datetime: "Friday @ 2:00 PM",
        pay: 120,
        tasks: "Deep clean, oven, fridge"
    }
};

// 2. Generate the HMAC Signature (Security Header)
const signature = crypto
    .createHmac('sha256', SHARED_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

// 3. Send the Request
async function runTest() {
    try {
        console.log("📨 Simulating Make.com sending a job...");
        
        const response = await axios.post(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-signature': signature
            }
        });

        console.log("\n✅ SUCCESS! Token Generated.");
        console.log("🔗 Offer Link:", response.data.link);
        console.log("-----------------------------------");
        console.log("👉 Copy and paste the link above into your browser to test the UI.");

    } catch (error) {
        console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
    }
}

runTest();