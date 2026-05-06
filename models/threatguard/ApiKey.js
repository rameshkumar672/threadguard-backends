const mongoose = require("mongoose");
const { tgConnection } = require("../../config/db");

const apiKeySchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, ref: "Website", required: true, index: true },
    key: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "revoked"], default: "active" }
  },
  { timestamps: true }
);

module.exports = tgConnection.models.ApiKey || tgConnection.model("ApiKey", apiKeySchema);
