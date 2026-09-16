const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { parseDuration, formatDuration } = require('../../utils/duration');
const { getUserIdFromUsername, setGameBan } = require('../../utils/roblox');

// Matches a bare duration token like "10m", "2h30m", "1d" — nothing else mixed in,
// so it isn't accidentally swallowed as the start of a reason.
const DURATION_ONLY = /^(\d+[smhdw])+$/i;

module.exports = {
  name: 'gameban',
  description: 'Ban a player from your Roblox game (via Open Cloud), not just this Discord',
  usage: `${config.PREFIX}gameban <roblox username|userId> [duration e.g. 1d] [reason]`,
  permissions: [PermissionFlagsBits.BanMembers],

  async execute(message, args) {
    const target = args[0];
    if (!target) {
      return message.reply(`❌ Usage: \`${this.usage}\``);
    }

    // Optional duration as the 2nd token — otherwise it's a permanent ban.
    let durationMs = null;
    let reasonArgs = args.slice(1);
    if (args[1] && DURATION_ONLY.test(args[1])) {
      durationMs = parseDuration(args[1]);
      reasonArgs = args.slice(2);
    }
    const reason = reasonArgs.join(' ').trim() || 'No reason provided';

    // Resolve to a Roblox user ID (accept either a raw ID or a username).
    let robloxUserId, robloxUsername;
    if (/^\d+$/.test(target)) {
      robloxUserId = target;
      robloxUsername = target;
    } else {
      let lookup;
      try {
        lookup = await getUserIdFromUsername(target);
      } catch (err) {
        console.error(err);
        return message.reply('❌ Failed to look up that Roblox username. Try again in a moment.');
      }
      if (!lookup) {
        return message.reply(`❌ No Roblox user found named **${target}**.`);
      }
      robloxUserId = lookup.id;
      robloxUsername = lookup.name;
    }

    try {
      await setGameBan(robloxUserId, {
        active: true,
        privateReason: `${reason} | Banned by ${message.author.tag} via Discord`,
        displayReason: reason,
        durationSeconds: durationMs ? Math.round(durationMs / 1000) : undefined,
        excludeAltAccounts: true,
      });
    } catch (err) {
      console.error(err);
      return message.reply(
        '❌ Failed to ban that player in-game. Double-check `ROBLOX_API_KEY` / `ROBLOX_UNIVERSE_ID` and that the key has the `universe.user-restriction:write` scope.',
      );
    }

    const durationLabel = durationMs ? formatDuration(durationMs) : 'Permanent';

    const resultEmbed = new EmbedBuilder()
      .setColor(config.COLORS.DANGER)
      .setDescription(
        `🎮 **${robloxUsername}** (\`${robloxUserId}\`) has been banned from the game.\n` +
          `**Duration:** ${durationLabel}\n**Reason:** ${reason}`,
      );

    await message.reply({ embeds: [resultEmbed] });

    await logAction(message.client, {
      action: '🎮 Game Ban',
      target: { tag: `${robloxUsername} (Roblox)`, id: robloxUserId },
      moderator: message.author,
      reason,
      color: config.COLORS.DANGER,
      extra: [{ name: 'Duration', value: durationLabel, inline: true }],
    });
  },
};
