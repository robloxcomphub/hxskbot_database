// Thin wrapper around the Roblox APIs used for in-game moderation.
//
// Needs two environment variables (see .env.example):
//   ROBLOX_API_KEY     — Open Cloud key from https://create.roblox.com/dashboard/credentials
//                         with the "universe.user-restriction:write" (and :read) scope,
//                         restricted to your universe/IP if possible.
//   ROBLOX_UNIVERSE_ID — the universe (experience) ID you want the bot to moderate.
//
// Docs: https://create.roblox.com/docs/en-us/cloud/reference/features/bans-and-blocks

const USERNAME_LOOKUP_URL = 'https://users.roblox.com/v1/usernames/users';
const CLOUD_BASE = 'https://apis.roblox.com/cloud/v2';

/**
 * Resolves a Roblox username to a user ID.
 * @returns {Promise<{id: number, name: string, displayName: string}|null>}
 */
async function getUserIdFromUsername(username) {
  const res = await fetch(USERNAME_LOOKUP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });

  if (!res.ok) {
    throw new Error(`Roblox username lookup failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  const match = data.data?.[0];
  if (!match) return null;

  return { id: match.id, name: match.name, displayName: match.displayName };
}

/**
 * Creates/updates an experience-level (universe-wide) join restriction — i.e. bans
 * or unbans a player from every place in your game.
 *
 * @param {number|string} robloxUserId
 * @param {object} opts
 * @param {boolean} opts.active - true to ban, false to lift an existing ban
 * @param {string} [opts.privateReason] - internal note, only visible to you (max 400 chars)
 * @param {string} [opts.displayReason] - shown to the banned player (max 400 chars)
 * @param {number} [opts.durationSeconds] - omit (or leave undefined) for a permanent ban
 * @param {boolean} [opts.excludeAltAccounts] - also try to catch alt accounts (default true)
 */
async function setGameBan(robloxUserId, opts = {}) {
  const universeId = process.env.ROBLOX_UNIVERSE_ID;
  const apiKey = process.env.ROBLOX_API_KEY;
  if (!universeId || !apiKey) {
    throw new Error('ROBLOX_UNIVERSE_ID and/or ROBLOX_API_KEY are not set in the environment.');
  }

  const {
    active,
    privateReason = 'No reason provided',
    displayReason = 'No reason provided',
    durationSeconds,
    excludeAltAccounts = true,
  } = opts;

  const gameJoinRestriction = {
    active,
    privateReason: privateReason.slice(0, 400),
    displayReason: displayReason.slice(0, 400),
    excludeAltAccounts,
  };

  // IMPORTANT: only include "duration" for a temporary ban. Roblox treats an
  // *omitted* duration field as permanent — sending e.g. duration: -1 errors out.
  if (typeof durationSeconds === 'number' && durationSeconds > 0) {
    gameJoinRestriction.duration = `${Math.round(durationSeconds)}s`;
  }

  const url =
    `${CLOUD_BASE}/universes/${universeId}/user-restrictions/${robloxUserId}` +
    `?updateMask=gameJoinRestriction`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameJoinRestriction }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Roblox Open Cloud error (HTTP ${res.status}): ${text}`);
  }

  return res.json();
}

module.exports = { getUserIdFromUsername, setGameBan };
