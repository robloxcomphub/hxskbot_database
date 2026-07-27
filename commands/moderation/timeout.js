const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { logAction, tryDM } = require('../../utils/modLog');
const { resolveMember } = require('../../utils/resolve');
const { parseDuration } = require('../../utils/duration');

module.exports = {
  name: 'timeout',
  description: 'Timeout (mute) a member for a set duration',
  usage: `${config.PREFIX}timeout <@user|id> <duration e.g. 10m/2h/1d> [reason]`,
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(message, args) {
    const member = await resolveMember(message.guild, args);
    if (!member) {
      return message.reply(`❌ Couldn't find that member. Usage: \`${this.usage}\``);
    }

    const durationStr = args[1];
    const ms = parseDuration(durationStr);
    if (!ms || ms > 28 * 24 * 60 * 60 * 1000) {
      return message.reply(`❌ Invalid duration. Use a format like \`10m\`, \`2h\`, or \`1d\` (max 28d). Usage: \`${this.usage}\``);
    }
    if (!member.moderatable) {
      return message.reply('❌ I cannot timeout that member. They may have a higher role than me.');
    }

    const reason = args.slice(2).join(' ').trim() || 'No reason provided';
    const targetUser = member.user;

    const dmEmbed = new EmbedBuilder()
      .setColor(config.COLORS.WARNING)
      .setTitle(`You were timed out in ${message.guild.name}`)
      .addFields(
        { name: 'Duration', value: durationStr },
        { name: 'Reason', value: reason },
      )
      .setTimestamp();

    const dmSent = await tryDM(targetUser, dmEmbed);

    try {
      await member.timeout(ms, `${reason} | By ${message.author.tag}`);
    } catch (err) {
      console.error(err);
      return message.reply('❌ Failed to timeout that user.');
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(config.COLORS.WARNING)
      .setDescription(`🔇 **${targetUser.tag}** has been timed out for **${durationStr}**.\n**Reason:** ${reason}`);

    await message.reply({ embeds: [resultEmbed] });

    await logAction(message.client, {
      action: '🔇 Member Timed Out',
      target: targetUser,
      moderator: message.author,
      reason,
      color: config.COLORS.WARNING,
      dmSent,
      extra: [{ name: 'Duration', value: durationStr, inline: true }],
    });
  },
};
