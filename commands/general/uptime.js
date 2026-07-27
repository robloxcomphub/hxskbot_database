const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
  name: 'uptime',
  description: 'Check how long the bot has been online',
  usage: `${config.PREFIX}uptime`,

  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(config.COLORS.PRIMARY)
      .setTitle('⏱️ Bot Uptime')
      .setDescription(formatUptime(message.client.uptime));

    await message.reply({ embeds: [embed] });
  },
};
