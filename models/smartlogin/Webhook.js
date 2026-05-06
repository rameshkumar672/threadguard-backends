const mongoose = require("mongoose");
const { slConnection } = require("../../config/db");

const webhookSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    url: { type: String, required: true },
    events: [{ type: String, enum: ["login", "attack", "blocked_ip"] }],
    secret: { type: String },
    status: { type: String, enum: ["active", "disabled"], default: "active" }
  },
  { timestamps: true }
);

module.exports = slConnection.models.Webhook || slConnection.model("Webhook", webhookSchema);
