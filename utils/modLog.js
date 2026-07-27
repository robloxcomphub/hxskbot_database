const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Sends a standardized moderation log embed to the configured log channel.
 * @param {import('discord.js').Client} client
 * @param {{action: string, target: import('discord.js').User, moderator: import('discord.js').User, reason: string, color?: number, extra?: {name: string, value: string}[], dmSent?: boolean}} data
 */
async function logAction(client, data) {
  const { action, target, moderator, reason, color, extra = [], dmSent } = data;

  const embed = new EmbedBuilder()
    .setColor(color || config.COLORS.PRIMARY)
    .setAuthor({ name: action, iconURL: target.displayAvatarURL?.() })
    .addFields(
      { name: 'User', value: `${target.tag ?? target} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
      { name: 'Reason', value: reason || 'No reason provided' },
    )
    .setTimestamp();

  if (typeof dmSent === 'boolean') {
    embed.addFields({ name: 'DM Notified', value: dmSent ? '✅ Yes' : '⚠️ Could not DM user', inline: true });
  }

  if (extra.length) embed.addFields(extra);

  try {
    const channel = await client.channels.fetch(config.MOD_LOG_CHANNEL_ID);
    if (channel) await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('❌ Failed to send mod log:', err);
  }
}

/**
 * Attempts to DM a user, returns true/false for whether it succeeded.
 */
async function tryDM(user, embed) {
  try {
    await user.send({ embeds: [embed] });
    return true;
  } catch {
    return false;
  }
}

module.exports = { logAction, tryDM };
