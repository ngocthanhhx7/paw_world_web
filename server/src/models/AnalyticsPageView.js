const mongoose = require('mongoose');

const analyticsPageViewSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, default: null, index: true },
    anonymousId: { type: String, required: true, index: true },
    pagePath: { type: String, required: true, index: true },
    pageTitle: { type: String, default: '' },
    fullUrl: { type: String, default: '' },
    referrer: { type: String, default: '' },
    timeOnPage: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

analyticsPageViewSchema.index({ pagePath: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsPageView', analyticsPageViewSchema);
