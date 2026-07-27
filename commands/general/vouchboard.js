const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { getDB } = require('../../utils/db');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  name: 'vouchboard',
  description: 'Show the most-vouched members in this server',
  usage: `${config.PREFIX}vouchboard`,

  async execute(message) {
    const vouches = getDB().collection('vouches');

    const top = await vouches.aggregate([
      { $match: { guildId: message.guild.id } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]).toArray();

    if (!top.length) {
      return message.reply('No one has been vouched for yet.');
    }

    const lines = top.map((entry, i) => `${MEDALS[i] || `**${i + 1}.**`} <@${entry._id}> — ${entry.count} vouch(es)`);

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.SUCCESS)
      .setTitle(`🏆 Vouch Leaderboard — ${message.guild.name}`)
      .setDescription(lines.join('\n'));

    await message.reply({ embeds: [embed] });
  },
};
