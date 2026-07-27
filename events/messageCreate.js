const config = require('../config');

// Only members with this role can use restricted commands (anything below
// with a "permissions" array — currently moderation + giveaway-management).
// General commands like .ping/.help/.vouch stay open to everyone.
const STAFF_ROLE_ID = '1530304274901368894';

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return; // ignore DMs
    if (!message.content.startsWith(config.PREFIX)) return;

    const args = message.content.slice(config.PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    if (!commandName) return;

    const command = message.client.commands.get(commandName);
    if (!command) return;

    if (command.permissions?.length && !message.member.roles.cache.has(STAFF_ROLE_ID)) {
      return message.reply("❌ You don't have permission to use that command.");
    }

    try {
      await command.execute(message, args, message.client);
    } catch (err) {
      console.error(`❌ Error executing ${config.PREFIX}${commandName}:`, err);
      await message.reply('❌ Something went wrong while running that command.').catch(() => null);
    }
  },
};
