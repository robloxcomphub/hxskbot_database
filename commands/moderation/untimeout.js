const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { logAction, tryDM } = require('../../utils/modLog');
const { resolveMember, reasonFrom } = require('../../utils/resolve');

module.exports = {
  name: 'untimeout',
  description: 'Remove an active timeout from a member',
  usage: `${config.PREFIX}untimeout <@user|id> [reason]`,
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(message, args) {
    const member = await resolveMember(message.guild, args);
    if (!member) {
      return message.reply(`❌ Couldn't find that member. Usage: \`${this.usage}\``);
    }
    if (!member.communicationDisabledUntil || member.communicationDisabledUntil < new Date()) {
      return message.reply('❌ That member is not currently timed out.');
    }

    const reason = reasonFrom(args);
    const targetUser = member.user;

    try {
      await member.timeout(null, `${reason} | By ${message.author.tag}`);
    } catch (err) {
      console.error(err);
      return message.reply('❌ Failed to remove the timeout.');
    }

    const dmEmbed = new EmbedBuilder()
      .setColor(config.COLORS.SUCCESS)
      .setTitle(`Your timeout in ${message.guild.name} was removed`)
      .addFields({ name: 'Reason', value: reason })
      .setTimestamp();

    const dmSent = await tryDM(targetUser, dmEmbed);

    const resultEmbed = new EmbedBuilder()
      .setColor(config.COLORS.SUCCESS)
      .setDescription(`🔊 **${targetUser.tag}**'s timeout has been removed.\n**Reason:** ${reason}`);

    await message.reply({ embeds: [resultEmbed] });

    await logAction(message.client, {
      action: '🔊 Timeout Removed',
      target: targetUser,
      moderator: message.author,
      reason,
      color: config.COLORS.SUCCESS,
      dmSent,
    });
  },
};
