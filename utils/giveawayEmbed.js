const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

function buildEnterRow(giveawayId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway_enter_${giveawayId}`)
      .setLabel('Enter Giveaway')
      .setEmoji(config.GIVEAWAY_EMOJI)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
  );
}

/**
 * Builds the giveaway embed. Mirrors the requested layout:
 * Title = prize, description lists winners/host/extra info/end time/bonus entries,
 * footer "Ends at" + embed timestamp renders as "Ends at • Today at 2:02 PM".
 */
function buildGiveawayEmbed(giveaway, { ended = false } = {}) {
  const endSeconds = Math.floor(giveaway.endTimestamp / 1000);

  const lines = [
    ended ? '🎉 **GIVEAWAY ENDED** 🎉' : `Click the ${config.GIVEAWAY_EMOJI} button below to enter!`,
    '',
    `**Winners:** ${giveaway.winnerCount}`,
    `**Hosted by:** <@${giveaway.hostId}>`,
  ];

  if (giveaway.extraInfo) lines.push(giveaway.extraInfo);

  lines.push(
    `**Ends:** <t:${endSeconds}:F> (<t:${endSeconds}:R>)`,
    `**Extra Entries:** <@&${config.GIVEAWAY_BONUS_ROLE_ID}>: +1 entry`,
    '',
    `**Entries:** ${giveaway.entries.length}`,
  );

  if (ended) {
    lines.push('', giveaway.winners?.length
      ? `**Winner(s):** ${giveaway.winners.map(id => `<@${id}>`).join(', ')}`
      : '**Winner(s):** No valid entries — no winner could be drawn.');
  }

  const embed = new EmbedBuilder()
    .setColor(ended ? config.COLORS.PRIMARY : config.COLORS.GIVEAWAY)
    .setTitle(giveaway.prize)
    .setDescription(lines.join('\n'))
    .setFooter({ text: ended ? 'Ended at' : 'Ends at' })
    .setTimestamp(ended ? Date.now() : giveaway.endTimestamp);

  return embed;
}

module.exports = { buildGiveawayEmbed, buildEnterRow };
