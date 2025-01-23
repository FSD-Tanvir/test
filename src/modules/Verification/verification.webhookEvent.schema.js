// models/webhookEvent.js
const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
    id: { type: String,  },
    attemptId: { type: String,  },
    feature: { type: String, },
    code: { type: Number,  },
    action: { type: String, },
    vendorData: { type: String,  },
    endUserId: { type: String }
}, { timestamps: true });

const MWebhookEvent = mongoose.model('veriffWebhookEvent', webhookEventSchema);

module.exports = { MWebhookEvent };
