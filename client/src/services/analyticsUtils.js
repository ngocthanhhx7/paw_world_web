const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export function createAnalyticsId(prefix) {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

function safeUrl(fullUrl) {
  try {
    return new URL(fullUrl || 'http://localhost/');
  } catch {
    return new URL('http://localhost/');
  }
}

export function classifyTrafficSource(fullUrl = '', referrer = '') {
  const url = safeUrl(fullUrl);
  const params = url.searchParams;
  const normalizedReferrer = String(referrer || '').trim();
  const utmSource = params.get('utm_source');
  if (utmSource) {
    return {
      source: utmSource,
      medium: params.get('utm_medium') || '',
      campaign: params.get('utm_campaign') || '',
      content: params.get('utm_content') || '',
      term: params.get('utm_term') || '',
      referrer: normalizedReferrer,
    };
  }

  const haystack = `${normalizedReferrer} ${url.search}`.toLowerCase();
  if (haystack.includes('fbclid') || haystack.includes('facebook.com') || haystack.includes('fb.com')) {
    return { source: 'Facebook', medium: 'social', campaign: '', content: '', term: '', referrer: normalizedReferrer };
  }
  if (haystack.includes('zalo')) return { source: 'Zalo', medium: 'social', campaign: '', content: '', term: '', referrer: normalizedReferrer };
  if (haystack.includes('google.')) return { source: 'Google', medium: 'organic', campaign: '', content: '', term: '', referrer: normalizedReferrer };
  if (haystack.includes('tiktok.')) return { source: 'TikTok', medium: 'social', campaign: '', content: '', term: '', referrer: normalizedReferrer };
  if (haystack.includes('instagram.')) return { source: 'Instagram', medium: 'social', campaign: '', content: '', term: '', referrer: normalizedReferrer };
  if (haystack.includes('youtube.') || haystack.includes('youtu.be')) return { source: 'YouTube', medium: 'social', campaign: '', content: '', term: '', referrer: normalizedReferrer };
  if (!normalizedReferrer) return { source: 'Direct', medium: 'direct', campaign: '', content: '', term: '', referrer: '' };
  return { source: 'Other Referral', medium: 'referral', campaign: '', content: '', term: '', referrer: normalizedReferrer };
}

export function shouldStartNewSession(lastActivityAt, now = Date.now()) {
  if (!lastActivityAt) return true;
  return now - Number(lastActivityAt) > SESSION_TIMEOUT_MS;
}

export function getDeviceInfo(userAgent = '') {
  const ua = String(userAgent || '');
  const lower = ua.toLowerCase();
  const deviceType = /ipad|tablet/.test(lower) ? 'tablet' : /mobile|iphone|android/.test(lower) ? 'mobile' : 'desktop';
  const browser = /edg\//i.test(ua)
    ? 'Edge'
    : /chrome|crios/i.test(ua)
      ? 'Chrome'
      : /safari/i.test(ua)
        ? 'Safari'
        : /firefox/i.test(ua)
          ? 'Firefox'
          : 'unknown';
  const os = /windows/i.test(ua)
    ? 'Windows'
    : /iphone|ipad|ios/i.test(ua)
      ? 'iOS'
      : /android/i.test(ua)
        ? 'Android'
        : /mac os/i.test(ua)
          ? 'macOS'
          : 'unknown';
  return { deviceType, browser, os };
}

export { SESSION_TIMEOUT_MS };
