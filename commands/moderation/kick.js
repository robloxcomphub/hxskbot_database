const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { logAction, tryDM } = require('../../utils/modLog');
const { resolveMember, reasonFrom } = require('../../utils/resolve');

module.exports = {
  name: 'kick',
  description: 'Kick a member from the server',
  usage: `${config.PREFIX}kick <@user|id> [reason]`,
  permissions: [PermissionFlagsBits.KickMembers],

  async execute(message, args) {
    const member = await resolveMember(message.guild, args);
    if (!member) {
      return message.reply(`❌ Couldn't find that member. Usage: \`${this.usage}\``);
    }
    if (!member.kickable) {
      return message.reply('❌ I cannot kick that member. They may have a higher role than me.');
    }
    if (member.id === message.author.id) {
      return message.reply('❌ You cannot kick yourself.');
    }

    const reason = reasonFrom(args);
    const targetUser = member.user;

    const dmEmbed = new EmbedBuilder()
      .setColor(config.COLORS.WARNING)
      .setTitle(`You were kicked from ${message.guild.name}`)
      .addFields({ name: 'Reason', value: reason })
      .setTimestamp();

    const dmSent = await tryDM(targetUser, dmEmbed);

    try {
      await member.kick(`${reason} | By ${message.author.tag}`);
    } catch (err) {
      console.error(err);
      return message.reply('❌ Failed to kick that user.');
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(config.COLORS.WARNING)
      .setDescription(`👢 **${targetUser.tag}** has been kicked.\n**Reason:** ${reason}`);

    await message.reply({ embeds: [resultEmbed] });

    await logAction(message.client, {
      action: '👢 Member Kicked',
      target: targetUser,
      moderator: message.author,
      reason,
      color: config.COLORS.WARNING,
      dmSent,
    });
  },
};
