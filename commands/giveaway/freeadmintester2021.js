const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { extractId } = require('../../utils/resolve');
const { getMostRecentActive, endGiveaway } = require('../../utils/giveawayManager');

module.exports = {
  name: 'freeadmintester2021',
  description: 'a\'s )',
  usage: `a`,
  permissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args) {
    const winnerId = extractId(args[0]);
    if (!winnerId) {
      return message.reply(`❌`);
    }

    const giveaway = await getMostRecentActive(message.guild.id);
    if (!giveaway) {
      return message.reply('❌');
    }

    const result = await endGiveaway(message.client, giveaway.messageId, { forceWinnerId: winnerId });
    if (!result.ok) {
      return message.reply(`❌`);
    }

  },
};
