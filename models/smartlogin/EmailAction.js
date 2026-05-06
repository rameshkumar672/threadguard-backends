const mongoose = require("mongoose");
const { slConnection } = require("../../config/db");

const emailActionSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    email: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: ["alert", "warning", "block"],
    },
    status: {
      type: String,
      enum: ["pending", "sent"],
      default: "pending",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

module.exports = slConnection.models.EmailAction || slConnection.model("EmailAction", emailActionSchema);
