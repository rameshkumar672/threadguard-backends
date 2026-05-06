const mongoose = require("mongoose");
const { slConnection } = require("../../config/db");

const otpVerificationSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = slConnection.models.OTPVerification || slConnection.model("OTPVerification", otpVerificationSchema);
