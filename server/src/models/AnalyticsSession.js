const mongoose = require('mongoose');

const analyticsSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    userId: { type: String, default: null, index: true },
    startedAt: { type: Date, required: true, index: true },
    endedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, required: true, index: true },
    landingPage: { type: String, default: '' },
    exitPage: { type: String, default: '' },
    source: { type: String, default: 'Direct', index: true },
    medium: { type: String, default: 'direct' },
    campaign: { type: String, default: '', index: true },
    content: { type: String, default: '' },
    term: { type: String, default: '' },
    referrer: { type: String, default: '' },
    deviceType: { type: String, default: 'unknown', index: true },
    browser: { type: String, default: 'unknown' },
    os: { type: String, default: 'unknown' },
  },
  { timestamps: true },
);

analyticsSessionSchema.index({ source: 1, startedAt: -1 });
analyticsSessionSchema.index({ campaign: 1, startedAt: -1 });

module.exports = mongoose.model('AnalyticsSession', analyticsSessionSchema);
