const mongoose = require('mongoose');

const jobOfferSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    cleanerId: { type: String, required: true },
    cleanerName: { type: String, required: true },
    jobDetails: {
        id: String,
        location: String,
        datetime: String,
        pay: Number,
        tasks: String
    },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'declined', 'expired'],
        default: 'pending'
    },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }
});

// Create indexes
jobOfferSchema.index({ token: 1 }, { unique: true });
jobOfferSchema.index({ cleanerId: 1 });
jobOfferSchema.index({ status: 1 });
jobOfferSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL Index

module.exports = mongoose.model('JobOffer', jobOfferSchema);
