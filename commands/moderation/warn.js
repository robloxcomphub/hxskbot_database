const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { logAction, tryDM } = require('../../utils/modLog');
const { resolveMember, reasonFrom } = require('../../utils/resolve');
const { getDB } = require('../../utils/db');

module.exports = {
  name: 'warn',
  description: 'Warn a member and log it to their record',
  usage: `${config.PREFIX}warn <@user|id> <reason>`,
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(message, args) {
    const member = await resolveMember(message.guild, args);
    if (!member) {
      return message.reply(`❌ Couldn't find that member. Usage: \`${this.usage}\``);
    }

    const reason = reasonFrom(args, null);
    if (!reason) {
      return message.reply(`❌ You must give a reason. Usage: \`${this.usage}\``);
    }

    const targetUser = member.user;
    const warnings = getDB().collection('warnings');

    await warnings.insertOne({
      guildId: message.guild.id,
      userId: targetUser.id,
      reason,
      moderatorId: message.author.id,
      timestamp: Date.now(),
    });

    const totalWarnings = await warnings.countDocuments({ guildId: message.guild.id, userId: targetUser.id });

    const dmEmbed = new EmbedBuilder()
      .setColor(config.COLORS.WARNING)
      .setTitle(`You were warned in ${message.guild.name}`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Total Warnings', value: `${totalWarnings}` },
      )
      .setTimestamp();

    const dmSent = await tryDM(targetUser, dmEmbed);

    const resultEmbed = new EmbedBuilder()
      .setColor(config.COLORS.WARNING)
      .setDescription(`⚠️ **${targetUser.tag}** has been warned. (${totalWarnings} total)\n**Reason:** ${reason}`);

    await message.reply({ embeds: [resultEmbed] });

    await logAction(message.client, {
      action: '⚠️ Member Warned',
      target: targetUser,
      moderator: message.author,
      reason,
      color: config.COLORS.WARNING,
      dmSent,
      extra: [{ name: 'Total Warnings', value: `${totalWarnings}`, inline: true }],
    });
  },
};
