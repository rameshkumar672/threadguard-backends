const mongoose = require("mongoose");
const { tgConnection } = require("../../config/db");

const websiteSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true
    },
    siteName: {
      type: String,
      required: true
    },
    websiteUrl: {
      type: String,
      required: true
    },
    apiKey: {
      type: String,
      required: true,
      unique: true
    },
    verificationToken: {
      type: String
    },
    verified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active"
    },
    settings: {
      lockdownMode: {
        type: Boolean,
        default: false
      },
      mfaRequired: {
        type: Boolean,
        default: false
      },
      rateLimitThreshold: {
        type: Number,
        default: 5
      }
    }
  },
  { timestamps: true }
);

module.exports = tgConnection.models.Website || tgConnection.model("Website", websiteSchema);
