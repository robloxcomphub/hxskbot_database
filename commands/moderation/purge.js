const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { extractId } = require('../../utils/resolve');

module.exports = {
  name: 'purge',
  description: 'Bulk delete recent messages in this channel',
  usage: `${config.PREFIX}purge <amount 1-100> [@user]`,
  permissions: [PermissionFlagsBits.ManageMessages],

  async execute(message, args) {
    const amount = Number(args[0]);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      return message.reply(`❌ Give an amount between 1 and 100. Usage: \`${this.usage}\``);
    }

    const filterUserId = args[1] ? extractId(args[1]) : null;

    // Delete the invoking command message too, plus fetch enough history to
    // filter by user if needed.
    const fetched = await message.channel.messages.fetch({ limit: filterUserId ? 100 : amount + 1 });

    const toDelete = filterUserId
      ? [...fetched.filter(m => m.author.id === filterUserId).values()].slice(0, amount)
      : fetched;

    let deleted;
    try {
      deleted = await message.channel.bulkDelete(toDelete, true);
    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to delete messages. Messages older than 14 days can't be bulk deleted.");
    }

    const notice = await message.channel.send(
      `🧹 Deleted **${deleted.size}** message(s)${filterUserId ? ` from <@${filterUserId}>` : ''}.`,
    );
    setTimeout(() => notice.delete().catch(() => null), 5000);

    await logAction(message.client, {
      action: '🧹 Messages Purged',
      target: filterUserId ? { id: filterUserId, tag: `<@${filterUserId}>` } : message.author,
      moderator: message.author,
      reason: `Purged ${deleted.size} message(s) in #${message.channel.name}`,
      color: config.COLORS.PRIMARY,
    });
  },
};
