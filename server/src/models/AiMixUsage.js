const mongoose = require('mongoose');

const aiMixUsageSchema = new mongoose.Schema(
  {
    deviceIdHash: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    count: { type: Number, required: true, min: 0, default: 0 },
    lastCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

aiMixUsageSchema.index({ deviceIdHash: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('AiMixUsage', aiMixUsageSchema);
