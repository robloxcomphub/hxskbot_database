const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { resolveMember } = require('../../utils/resolve');
const { getDB } = require('../../utils/db');

module.exports = {
  name: 'vouch',
  description: 'Vouch for a member (e.g. after a trade)',
  usage: `${config.PREFIX}vouch <@user|id> [reason]`,

  async execute(message, args) {
    const member = await resolveMember(message.guild, args);
    if (!member) {
      return message.reply(`❌ Couldn't find that member. Usage: \`${this.usage}\``);
    }
    if (member.id === message.author.id) {
      return message.reply('❌ You cannot vouch for yourself.');
    }
    if (member.user.bot) {
      return message.reply('❌ You cannot vouch for a bot.');
    }

    const reason = args.slice(1).join(' ').trim() || null;
    const vouches = getDB().collection('vouches');

    await vouches.insertOne({
      guildId: message.guild.id,
      userId: member.id,
      voucherId: message.author.id,
      reason,
      timestamp: Date.now(),
    });

    const total = await vouches.countDocuments({ guildId: message.guild.id, userId: member.id });

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.SUCCESS)
      .setDescription(
        `✅ ${message.author} vouched for **${member.user.tag}**!${reason ? `\n**Reason:** ${reason}` : ''}\n**Total vouches:** ${total}`,
      );

    await message.reply({ embeds: [embed] });
  },
};
