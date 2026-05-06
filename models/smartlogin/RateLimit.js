const mongoose = require("mongoose");
const { slConnection } = require("../../config/db");

const rateLimitSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ipAddress: { type: String, required: true },
    endpoint: { type: String, required: true },
    hits: { type: Number, default: 1 },
    resetTime: { type: Date, required: true }
  },
  { timestamps: true }
);

// TTL index to automatically remove old records
rateLimitSchema.index({ resetTime: 1 }, { expireAfterSeconds: 0 });

module.exports = slConnection.models.RateLimit || slConnection.model("RateLimit", rateLimitSchema);
