const mongoose = require("mongoose");
const { tgConnection } = require("../../config/db");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    maxWebsites: { type: Number, default: 1 },
    maxUsersPerWebsite: { type: Number, default: 1000 },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" }
  },
  { timestamps: true }
);

module.exports = tgConnection.models.Plan || tgConnection.model("Plan", planSchema);
