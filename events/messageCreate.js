const config = require('../config');

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

    if (command.permissions?.length) {
      const missing = command.permissions.filter(perm => !message.member.permissions.has(perm));
      if (missing.length) {
        return message.reply("❌ You don't have permission to use that command.");
      }
    }

    try {
      await command.execute(message, args, message.client);
    } catch (err) {
      console.error(`❌ Error executing ${config.PREFIX}${commandName}:`, err);
      await message.reply('❌ Something went wrong while running that command.').catch(() => null);
    }
  },
};
