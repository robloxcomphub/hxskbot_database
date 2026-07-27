const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

const UNIT_LABEL = { s: 'second', m: 'minute', h: 'hour', d: 'day', w: 'week' };

/**
 * Parses a duration string like "10m", "2h30m", "1d" into milliseconds.
 * Supports combined units (e.g. "1d12h"). Returns null if invalid.
 */
function parseDuration(input) {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase().replace(/\s+/g, '');
  const regex = /(\d+)(s|m|h|d|w)/g;
  let match;
  let total = 0;
  let matchedAny = false;

  while ((match = regex.exec(cleaned)) !== null) {
    matchedAny = true;
    const [, amount, unit] = match;
    total += Number(amount) * UNIT_MS[unit];
  }

  if (!matchedAny) return null;
  return total > 0 ? total : null;
}

/** Formats milliseconds back into a short human-readable string, e.g. "1d 2h". */
function formatDuration(ms) {
  const units = [
    ['d', 24 * 60 * 60 * 1000],
    ['h', 60 * 60 * 1000],
    ['m', 60 * 1000],
    ['s', 1000],
  ];
  const parts = [];
  let remaining = ms;
  for (const [unit, unitMs] of units) {
    const value = Math.floor(remaining / unitMs);
    if (value > 0) {
      parts.push(`${value}${unit}`);
      remaining -= value * unitMs;
    }
  }
  return parts.length ? parts.join(' ') : '0s';
}

module.exports = { parseDuration, formatDuration, UNIT_LABEL };
