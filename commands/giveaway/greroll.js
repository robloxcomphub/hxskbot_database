const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { getGiveaway, drawWinners, saveGiveaway } = require('../../utils/giveawayManager');

module.exports = {
  name: 'greroll',
  description: 'Reroll winners for an ended giveaway',
  usage: `${config.PREFIX}greroll <message_id>`,
  permissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args) {
    const messageId = (args[0] || '').trim();
    if (!/^\d{17,20}$/.test(messageId)) {
      return message.reply(`❌ Usage: \`${this.usage}\``);
    }

    const giveaway = await getGiveaway(messageId);
    if (!giveaway) {
      return message.reply('❌ Giveaway not found.');
    }
    if (!giveaway.ended) {
      return message.reply(`❌ That giveaway hasn't ended yet. Use \`${config.PREFIX}gend\` first.`);
    }

    const winners = drawWinners(giveaway, message.guild);
    giveaway.winners = winners;
    await saveGiveaway(giveaway);

    if (!winners.length) {
      return message.reply(`😔 Couldn't reroll **${giveaway.prize}** — no valid entries.`);
    }

    await message.reply(`🎉 New winner(s) for **${giveaway.prize}**: ${winners.map(id => `<@${id}>`).join(', ')}!`);
  },
};
