require('dotenv').config();

const PORT = process.env.PORT || 3000;

module.exports = {
    SHARED_SECRET: process.env.SHARED_SECRET || 'my-super-secret-key',
    BASE_URL: process.env.BASE_URL || `http://localhost:${PORT}`,
    DEFAULT_EXPIRY_MINUTES: 15,
    MAKE_WEBHOOK_URL: process.env.MAKE_WEBHOOK_URL || 'https://hook.us1.make.com/your-webhook-id',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/job-offers',
    PORT
};
