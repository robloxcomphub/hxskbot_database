const config = require('../config');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const channel = await member.guild.channels.fetch(config.WELCOME_PING_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const ping = await channel.send(`${member}`).catch(() => null);
    if (!ping) return;

    ping.delete().catch(() => null);
  },
};
