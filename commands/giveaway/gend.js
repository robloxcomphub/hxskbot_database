const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { endGiveaway } = require('../../utils/giveawayManager');

module.exports = {
  name: 'gend',
  description: 'End a giveaway early and draw winners',
  usage: `${config.PREFIX}gend <message_id>`,
  permissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args) {
    const messageId = (args[0] || '').trim();
    if (!/^\d{17,20}$/.test(messageId)) {
      return message.reply(`❌ Usage: \`${this.usage}\``);
    }

    const result = await endGiveaway(message.client, messageId);
    if (!result.ok) {
      return message.reply(`❌ ${result.reason}`);
    }

    await message.reply(
      result.winners.length
        ? `✅ Giveaway ended! Winner(s): ${result.winners.map(id => `<@${id}>`).join(', ')}`
        : '✅ Giveaway ended with no valid entries.',
    );
  },
};
