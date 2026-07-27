const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'serverinfo',
  description: 'View information about this server',
  usage: `${config.PREFIX}serverinfo`,

  async execute(message) {
    const guild = message.guild;
    const owner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.PRIMARY)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Owner', value: owner ? `${owner.user.tag}` : 'Unknown', inline: true },
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Boost Level', value: `${guild.premiumTier ?? 0}`, inline: true },
      );

    await message.reply({ embeds: [embed] });
  },
};
