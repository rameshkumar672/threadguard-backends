const mongoose = require("mongoose");
const { tgConnection } = require("../../config/db");

const subSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    status: { type: String, enum: ["active", "canceled", "expired"], default: "active" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }
  },
  { timestamps: true }
);

module.exports = tgConnection.models.Subscription || tgConnection.model("Subscription", subSchema);
