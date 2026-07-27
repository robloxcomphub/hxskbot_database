const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { logAction, tryDM } = require('../../utils/modLog');
const { resolveMember, reasonFrom } = require('../../utils/resolve');

module.exports = {
  name: 'ban',
  description: 'Ban a member from the server',
  usage: `${config.PREFIX}ban <@user|id> [reason]`,
  permissions: [PermissionFlagsBits.BanMembers],

  async execute(message, args) {
    const member = await resolveMember(message.guild, args);
    if (!member) {
      return message.reply(`❌ Couldn't find that member. Usage: \`${this.usage}\``);
    }
    if (!member.bannable) {
      return message.reply('❌ I cannot ban that member. They may have a higher role than me.');
    }
    if (member.id === message.author.id) {
      return message.reply('❌ You cannot ban yourself.');
    }

    const reason = reasonFrom(args);
    const targetUser = member.user;

    const dmEmbed = new EmbedBuilder()
      .setColor(config.COLORS.DANGER)
      .setTitle(`You were banned from ${message.guild.name}`)
      .addFields({ name: 'Reason', value: reason })
      .setTimestamp();

    const dmSent = await tryDM(targetUser, dmEmbed);

    try {
      await message.guild.members.ban(targetUser.id, { reason: `${reason} | By ${message.author.tag}` });
    } catch (err) {
      console.error(err);
      return message.reply('❌ Failed to ban that user. Check my permissions and role position.');
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(config.COLORS.DANGER)
      .setDescription(`🔨 **${targetUser.tag}** has been banned.\n**Reason:** ${reason}`);

    await message.reply({ embeds: [resultEmbed] });

    await logAction(message.client, {
      action: '🔨 Member Banned',
      target: targetUser,
      moderator: message.author,
      reason,
      color: config.COLORS.DANGER,
      dmSent,
    });
  },
};
