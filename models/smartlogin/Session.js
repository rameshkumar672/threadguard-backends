const mongoose = require("mongoose");
const { slConnection } = require("../../config/db");

const sessionSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = slConnection.models.Session || slConnection.model("Session", sessionSchema);
