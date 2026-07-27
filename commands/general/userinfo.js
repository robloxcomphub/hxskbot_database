const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { resolveMember } = require('../../utils/resolve');

module.exports = {
  name: 'userinfo',
  description: 'View information about a member',
  usage: `${config.PREFIX}userinfo [@user|id]`,

  async execute(message, args) {
    const member = args[0]
      ? await resolveMember(message.guild, args)
      : message.member;

    if (!member) {
      return message.reply("❌ Couldn't find that member.");
    }

    const targetUser = member.user;

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.PRIMARY)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setTitle(targetUser.tag)
      .addFields(
        { name: 'User ID', value: targetUser.id, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Joined Server', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
        {
          name: `Roles [${member.roles.cache.size - 1}]`,
          value: member.roles.cache.filter(r => r.id !== message.guild.id).map(r => `${r}`).slice(0, 20).join(' ') || 'None',
        },
      );

    await message.reply({ embeds: [embed] });
  },
};
