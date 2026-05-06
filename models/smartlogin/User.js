const mongoose = require("mongoose");
const { slConnection } = require("../../config/db");

const userSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    name: {
      type: String,
      trim: true,
      default: "User"
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    loginAttempts: {
      count: { type: Number, default: 0 },
      firstAttemptTime: { type: Date, default: null }
    },
    lockedUntil: {
      type: Date,
      default: null
    },
    lastLogin: {
      type: Date,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// A user is unique PER website, not globally.
userSchema.index({ websiteId: 1, email: 1 }, { unique: true });

module.exports = slConnection.models.User || slConnection.model("User", userSchema, "users");
