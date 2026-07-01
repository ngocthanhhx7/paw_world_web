const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    dedupeKey: { type: String, default: '' },
    eventName: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    userId: { type: String, default: null, index: true },
    anonymousId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    pagePath: { type: String, default: '', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

analyticsEventSchema.index({ eventName: 1, createdAt: -1 });
analyticsEventSchema.index({ sessionId: 1, createdAt: -1 });
analyticsEventSchema.index({ anonymousId: 1, userId: 1, createdAt: -1 });
analyticsEventSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string', $gt: '' } } },
);

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
