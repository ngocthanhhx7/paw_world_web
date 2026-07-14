const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function getVietnamParts(date) {
  const shifted = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function startOfVietnamDay(year, month, day) {
  return new Date(Date.UTC(year, month, day) - VIETNAM_OFFSET_MS);
}

function endOfVietnamDay(year, month, day) {
  return new Date(Date.UTC(year, month, day + 1) - VIETNAM_OFFSET_MS - 1);
}

function addDays(parts, delta) {
  const date = new Date(Date.UTC(parts.year, parts.month, parts.day + delta));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate() };
}

function parseIsoDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

function parseDateRange(query = {}, now = new Date()) {
  const preset = query.preset || query.range || 'last_7_days';
  const today = getVietnamParts(now);
  let startParts;
  let endParts = today;
  let label;

  if (preset === 'today') {
    startParts = today;
    label = 'Today';
  } else if (preset === 'yesterday') {
    startParts = addDays(today, -1);
    endParts = startParts;
    label = 'Yesterday';
  } else if (preset === 'last_30_days') {
    startParts = addDays(today, -29);
    label = 'Last 30 days';
  } else if (preset === 'this_month') {
    startParts = { year: today.year, month: today.month, day: 1 };
    label = 'This month';
  } else if (preset === 'custom') {
    startParts = parseIsoDate(query.startDate);
    endParts = parseIsoDate(query.endDate);
    label = `${query.startDate || ''} to ${query.endDate || ''}`;
    if (!startParts || !endParts) throw new Error('Invalid date range');
  } else {
    startParts = addDays(today, -6);
    label = 'Last 7 days';
  }

  const start = startOfVietnamDay(startParts.year, startParts.month, startParts.day);
  const end = endOfVietnamDay(endParts.year, endParts.month, endParts.day);
  if (start > end) throw new Error('Invalid date range');
  return { start, end, label, preset };
}

module.exports = {
  VIETNAM_OFFSET_MS,
  endOfVietnamDay,
  getVietnamParts,
  parseDateRange,
  startOfVietnamDay,
};
