const mongoose = require("mongoose");
const { slConnection } = require("../../config/db");

const trustedDeviceSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deviceFingerprint: { type: String, required: true },
    userAgent: { type: String },
    lastIpAddress: { type: String },
    lastUsedAt: { type: Date, default: Date.now },
    isTrusted: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = slConnection.models.TrustedDevice || slConnection.model("TrustedDevice", trustedDeviceSchema);
