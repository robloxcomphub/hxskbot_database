const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { extractId, reasonFrom } = require('../../utils/resolve');

module.exports = {
  name: 'unban',
  description: 'Unban a user by their user ID',
  usage: `${config.PREFIX}unban <user_id> [reason]`,
  permissions: [PermissionFlagsBits.BanMembers],

  async execute(message, args) {
    const userId = extractId(args[0]);
    if (!userId) {
      return message.reply(`❌ That doesn't look like a valid user ID. Usage: \`${this.usage}\``);
    }

    const reason = reasonFrom(args);

    const bans = await message.guild.bans.fetch().catch(() => null);
    if (!bans || !bans.has(userId)) {
      return message.reply('❌ That user is not currently banned.');
    }

    const bannedUser = bans.get(userId).user;

    try {
      await message.guild.bans.remove(userId, `${reason} | By ${message.author.tag}`);
    } catch (err) {
      console.error(err);
      return message.reply('❌ Failed to unban that user.');
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(config.COLORS.SUCCESS)
      .setDescription(`✅ **${bannedUser.tag}** has been unbanned.\n**Reason:** ${reason}`);

    await message.reply({ embeds: [resultEmbed] });

    await logAction(message.client, {
      action: '✅ Member Unbanned',
      target: bannedUser,
      moderator: message.author,
      reason,
      color: config.COLORS.SUCCESS,
    });
  },
};
