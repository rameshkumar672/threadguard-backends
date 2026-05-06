const mongoose = require("mongoose");
const { tgConnection } = require("../../config/db");

const ownerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Owner",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = tgConnection.models.Owner || tgConnection.model("Owner", ownerSchema);
