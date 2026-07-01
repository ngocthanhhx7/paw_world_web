function safeUrl(value) {
  try {
    return new URL(value || 'http://localhost/');
  } catch {
    return new URL('http://localhost/');
  }
}

function normalizeReferrer(referrer) {
  return typeof referrer === 'string' ? referrer.trim() : '';
}

function detectReferrerSource(fullUrl, referrer) {
  const url = safeUrl(fullUrl);
  const normalizedReferrer = normalizeReferrer(referrer);
  const haystack = `${normalizedReferrer} ${url.search}`.toLowerCase();

  if (haystack.includes('fbclid') || haystack.includes('facebook.com') || haystack.includes('fb.com')) {
    return { source: 'Facebook', medium: 'social' };
  }
  if (haystack.includes('zalo')) return { source: 'Zalo', medium: 'social' };
  if (haystack.includes('google.')) return { source: 'Google', medium: 'organic' };
  if (haystack.includes('tiktok.')) return { source: 'TikTok', medium: 'social' };
  if (haystack.includes('instagram.')) return { source: 'Instagram', medium: 'social' };
  if (haystack.includes('youtube.') || haystack.includes('youtu.be')) return { source: 'YouTube', medium: 'social' };

  if (!normalizedReferrer) return { source: 'Direct', medium: 'direct' };
  return { source: 'Other Referral', medium: 'referral' };
}

function classifyTrafficSource({ fullUrl = '', referrer = '' } = {}) {
  const url = safeUrl(fullUrl);
  const params = url.searchParams;
  const normalizedReferrer = normalizeReferrer(referrer);
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

  const detected = detectReferrerSource(fullUrl, normalizedReferrer);
  return {
    source: detected.source,
    medium: detected.medium,
    campaign: '',
    content: '',
    term: '',
    referrer: normalizedReferrer,
  };
}

module.exports = { classifyTrafficSource };
