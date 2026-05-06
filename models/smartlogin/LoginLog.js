const mongoose = require("mongoose");
const { slConnection } = require("../../config/db");

const loginLogSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String },
    status: { type: String, enum: ["success", "failed"], required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    failureReason: { type: String }
  },
  { timestamps: true }
);

module.exports = slConnection.models.LoginLog || slConnection.model("LoginLog", loginLogSchema);
