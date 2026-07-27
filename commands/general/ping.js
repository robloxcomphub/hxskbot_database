const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'ping',
  description: "Check the bot's latency",
  usage: `${config.PREFIX}ping`,

  async execute(message) {
    const sent = await message.reply('🏓 Pinging...');
    const roundTrip = sent.createdTimestamp - message.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.PRIMARY)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Roundtrip Latency', value: `${roundTrip}ms`, inline: true },
        { name: 'WebSocket Latency', value: `${message.client.ws.ping}ms`, inline: true },
      );

    await sent.edit({ content: null, embeds: [embed] });
  },
};
