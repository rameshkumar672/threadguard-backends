const mongoose = require("mongoose");
const { tgConnection } = require("../../config/db");

const ownerLogSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
    action: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String }
  },
  { timestamps: true }
);

module.exports = tgConnection.models.OwnerLog || tgConnection.model("OwnerLog", ownerLogSchema);
