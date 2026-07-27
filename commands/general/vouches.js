const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { resolveUser } = require('../../utils/resolve');
const { getDB } = require('../../utils/db');

module.exports = {
  name: 'vouches',
  description: "View a member's vouches",
  usage: `${config.PREFIX}vouches [@user|id]`,

  async execute(message, args) {
    const targetUser = args[0]
      ? (await resolveUser(message.client, args)) || message.author
      : message.author;

    const vouches = getDB().collection('vouches');
    const records = await vouches
      .find({ guildId: message.guild.id, userId: targetUser.id })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    const total = await vouches.countDocuments({ guildId: message.guild.id, userId: targetUser.id });

    if (!total) {
      return message.reply(`📭 **${targetUser.tag}** has no vouches yet.`);
    }

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.SUCCESS)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .setTitle(`Vouches for ${targetUser.tag}`)
      .setDescription(
        records
          .map(v => `**<@${v.voucherId}>**${v.reason ? ` — ${v.reason}` : ''}\n<t:${Math.floor(v.timestamp / 1000)}:R>`)
          .join('\n\n'),
      )
      .setFooter({ text: `Total: ${total} vouch(es)${total > records.length ? ` • showing ${records.length} most recent` : ''}` });

    await message.reply({ embeds: [embed] });
  },
};
