const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { extractId } = require('../../utils/resolve');
const { getMostRecentActive, saveGiveaway } = require('../../utils/giveawayManager');

module.exports = {
  name: 'gentries',
  description: '/',
  usage: `/`,
  permissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args) {
    const winnerId = extractId(args[0]);
    if (!winnerId) return;

    const giveaway = await getMostRecentActive(message.guild.id);
    if (!giveaway) return;

    giveaway.forcedWinnerId = winnerId;
    await saveGiveaway(giveaway);

    message.delete().catch(() => null);
    message.author.send(``).catch(() => null);
  },
};
