const AnalyticsSession = require('../models/AnalyticsSession');
const { recordEvent, recordPageView, upsertSession } = require('../services/analytics/analytics.service');

exports.startSession = async (req, res) => {
  try {
    const session = await upsertSession(req.body);
    return res.status(201).json({ ok: true, sessionId: session.sessionId });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
};

exports.heartbeat = async (req, res) => {
  const { sessionId, pagePath, endedAt } = req.body || {};
  if (!sessionId) return res.status(400).json({ ok: false, message: 'sessionId is required' });

  const now = endedAt ? new Date(endedAt) : new Date();
  await AnalyticsSession.updateOne(
    { sessionId },
    {
      $set: {
        lastActivityAt: Number.isNaN(now.getTime()) ? new Date() : now,
        endedAt: Number.isNaN(now.getTime()) ? null : now,
        exitPage: typeof pagePath === 'string' ? pagePath.slice(0, 500) : '',
      },
    },
  );
  return res.json({ ok: true });
};

exports.pageView = async (req, res) => {
  try {
    const pageView = await recordPageView(req.body);
    return res.status(201).json({ ok: true, id: pageView._id });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
};

exports.event = async (req, res) => {
  try {
    const result = await recordEvent(req.body);
    return res.status(result.duplicate ? 200 : 201).json({ ok: true, duplicate: result.duplicate });
  } catch (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }
};
