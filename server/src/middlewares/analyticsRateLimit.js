const hits = new Map();

function analyticsRateLimit({ windowMs = 60 * 1000, max = 180 } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.get('x-forwarded-for') || 'unknown';
    const bucket = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    hits.set(key, bucket);

    if (bucket.count > max) {
      return res.status(429).json({ message: 'Too many analytics requests' });
    }
    return next();
  };
}

module.exports = analyticsRateLimit;
