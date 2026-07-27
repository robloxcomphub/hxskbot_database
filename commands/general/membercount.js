const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'membercount',
  description: "View the server's member count",
  usage: `${config.PREFIX}membercount`,

  async execute(message) {
    const guild = message.guild;
    const humans = guild.members.cache.filter(m => !m.user.bot).size;
    const bots = guild.members.cache.filter(m => m.user.bot).size;

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.PRIMARY)
      .setTitle(`${guild.name} — Member Count`)
      .addFields(
        { name: 'Total', value: `${guild.memberCount}`, inline: true },
        { name: 'Humans', value: `${humans}`, inline: true },
        { name: 'Bots', value: `${bots}`, inline: true },
      );

    await message.reply({ embeds: [embed] });
  },
};
