const config = require('../config');
const { getDB } = require('./db');
const { buildGiveawayEmbed, buildEnterRow } = require('./giveawayEmbed');

const CHECK_INTERVAL_MS = 15 * 1000;

function collection() {
  return getDB().collection('giveaways');
}

/** All giveaway documents (used by the background checker). */
async function loadAll() {
  return collection().find({}).toArray();
}

/** Active (not-yet-ended) giveaways for one guild — used by /glist. */
async function loadActiveForGuild(guildId) {
  return collection().find({ guildId, ended: false }).toArray();
}

/**
 * The most recently started active giveaway in a guild. Message IDs are
 * Discord snowflakes, which sort chronologically as BigInts.
 */
async function getMostRecentActive(guildId) {
  const active = await loadActiveForGuild(guildId);
  if (!active.length) return null;
  return active.reduce((a, b) => (BigInt(a.messageId) > BigInt(b.messageId) ? a : b));
}

async function getGiveaway(messageId) {
  return collection().findOne({ _id: messageId });
}

async function saveGiveaway(giveaway) {
  const { messageId, ...rest } = giveaway;
  await collection().replaceOne(
    { _id: messageId },
    { _id: messageId, messageId, ...rest },
    { upsert: true },
  );
}

/**
 * Picks `count` unique winners from the entrant pool. Members with the
 * configured bonus role get one extra ticket (2 total) in the draw.
 */
function drawWinners(giveaway, guild) {
  const pool = [];

  for (const userId of giveaway.entries) {
    pool.push(userId); // base entry
    const member = guild?.members.cache.get(userId);
    if (member?.roles.cache.has(config.GIVEAWAY_BONUS_ROLE_ID)) {
      pool.push(userId); // bonus entry
    }
  }

  const winners = [];
  const remainingPool = [...pool];

  while (winners.length < giveaway.winnerCount && remainingPool.length > 0) {
    const index = Math.floor(Math.random() * remainingPool.length);
    const pickedId = remainingPool[index];

    for (let i = remainingPool.length - 1; i >= 0; i--) {
      if (remainingPool[i] === pickedId) remainingPool.splice(i, 1);
    }

    winners.push(pickedId);
  }

  return winners;
}

async function endGiveaway(client, messageId, { forceWinnerId } = {}) {
  const giveaway = await getGiveaway(messageId);
  if (!giveaway) return { ok: false, reason: 'Giveaway not found.' };
  if (giveaway.ended) return { ok: false, reason: 'That giveaway has already ended.' };

  const guild = await client.guilds.fetch(giveaway.guildId).catch(() => null);
  const channel = guild ? await guild.channels.fetch(giveaway.channelId).catch(() => null) : null;

  // forceWinnerId (explicit arg) or giveaway.forcedWinnerId (preset ahead of
  // time) is a disclosed override for pre-arranged pranks/tests — documented
  // in .help and known to whoever runs it, not a hidden cheat.
  const effectiveForcedWinner = forceWinnerId || giveaway.forcedWinnerId;
  const winners = effectiveForcedWinner ? [effectiveForcedWinner] : drawWinners(giveaway, guild);

  giveaway.ended = true;
  giveaway.winners = winners;
  await saveGiveaway(giveaway);

  if (channel) {
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (message) {
      await message.edit({
        embeds: [buildGiveawayEmbed(giveaway, { ended: true })],
        components: [buildEnterRow(messageId, true)],
      }).catch(() => null);
    }

    if (winners.length) {
      await channel.send({
        content: `🎉 Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!`,
      }).catch(() => null);

      for (const winnerId of winners) {
        const user = await client.users.fetch(winnerId).catch(() => null);
        if (user) {
          user.send(`🎉 You won **${giveaway.prize}** in **${guild?.name ?? 'the server'}**! Congratulations!`).catch(() => null);
        }
      }
    } else {
      await channel.send(`😔 The giveaway for **${giveaway.prize}** ended with no valid entries.`).catch(() => null);
    }
  }

  return { ok: true, giveaway, winners };
}

/**
 * Periodically queries MongoDB for giveaways whose end time has passed and
 * ends them. Runs entirely off persisted data, so it correctly recovers
 * giveaways that were still active before a restart/redeploy.
 */
function startGiveawayChecker(client) {
  setInterval(async () => {
    const now = Date.now();
    let due;
    try {
      due = await collection().find({ ended: false, endTimestamp: { $lte: now } }).toArray();
    } catch (err) {
      return console.error('❌ Failed to check for due giveaways:', err);
    }

    for (const giveaway of due) {
      await endGiveaway(client, giveaway.messageId).catch(err => console.error('❌ Failed to end giveaway:', err));
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  loadAll,
  loadActiveForGuild,
  getMostRecentActive,
  getGiveaway,
  saveGiveaway,
  drawWinners,
  endGiveaway,
  startGiveawayChecker,
};
