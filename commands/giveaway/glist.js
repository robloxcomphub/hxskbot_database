const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { loadActiveForGuild } = require('../../utils/giveawayManager');

module.exports = {
  name: 'glist',
  description: 'List active giveaways in this server',
  usage: `${config.PREFIX}glist`,

  async execute(message) {
    const active = await loadActiveForGuild(message.guild.id);

    if (!active.length) {
      return message.reply('There are no active giveaways right now.');
    }

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.GIVEAWAY)
      .setTitle('🎉 Active Giveaways')
      .setDescription(
        active
          .map(g => `**${g.prize}**\nID: \`${g.messageId}\` • Ends <t:${Math.floor(g.endTimestamp / 1000)}:R> • Entries: ${g.entries.length}`)
          .join('\n\n'),
      );

    await message.reply({ embeds: [embed] });
  },
};
