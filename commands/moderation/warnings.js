const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { extractId } = require('../../utils/resolve');
const { getDB } = require('../../utils/db');

module.exports = {
  name: 'warnings',
  description: "View or clear a member's warnings",
  usage: `${config.PREFIX}warnings <view|clear> <@user|id>`,
  permissions: [PermissionFlagsBits.ModerateMembers],

  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (sub !== 'view' && sub !== 'clear') {
      return message.reply(`❌ Usage: \`${this.usage}\``);
    }

    const userId = extractId(args[1]);
    if (!userId) {
      return message.reply(`❌ Couldn't find that member. Usage: \`${this.usage}\``);
    }

    const targetUser = await message.client.users.fetch(userId).catch(() => null);
    if (!targetUser) {
      return message.reply('❌ Could not find that user.');
    }

    const warningsCol = getDB().collection('warnings');

    if (sub === 'view') {
      const userWarnings = await warningsCol
        .find({ guildId: message.guild.id, userId })
        .sort({ timestamp: 1 })
        .toArray();

      if (!userWarnings.length) {
        return message.reply(`✅ **${targetUser.tag}** has no warnings.`);
      }

      const embed = new EmbedBuilder()
        .setColor(config.COLORS.WARNING)
        .setTitle(`Warnings for ${targetUser.tag}`)
        .setDescription(
          userWarnings
            .map((w, i) => `**${i + 1}.** ${w.reason}\n<t:${Math.floor(w.timestamp / 1000)}:R> • by <@${w.moderatorId}>`)
            .join('\n\n'),
        )
        .setFooter({ text: `Total: ${userWarnings.length} warning(s)` });

      return message.reply({ embeds: [embed] });
    }

    // sub === 'clear'
    await warningsCol.deleteMany({ guildId: message.guild.id, userId });
    return message.reply(`🧹 Cleared all warnings for **${targetUser.tag}**.`);
  },
};
