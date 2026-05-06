const mongoose = require("mongoose");
const { slConnection } = require("../../config/db");

const blockedIPSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ip: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    reason: {
      type: String,
      required: true,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// We should only block an IP per website/owner, unless we want global blocking, 
// for now keeping it scoped to owner/website context to avoid conflicts.
blockedIPSchema.index({ websiteId: 1, ip: 1 }, { unique: true });

module.exports = slConnection.models.BlockedIP || slConnection.model("BlockedIP", blockedIPSchema, "blockedips");
