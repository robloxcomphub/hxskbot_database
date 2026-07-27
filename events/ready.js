const { ActivityType } = require('discord.js');
const config = require('../config');
const { startGiveawayChecker } = require('../utils/giveawayManager');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`📊 Connected to ${client.guilds.cache.size} server(s)`);

    client.user.setPresence({
      activities: [{ name: `${config.PREFIX}help`, type: ActivityType.Watching }],
      status: 'online',
    });

    startGiveawayChecker(client);
    console.log('🎉 Giveaway checker started.');
  },
};
