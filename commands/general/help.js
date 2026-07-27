const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

const CATEGORY_LABELS = {
  moderation: '🛡️ Moderation',
  giveaway: '🎉 Giveaway',
  general: '✨ General',
};

module.exports = {
  name: 'help',
  description: 'View all available commands',
  usage: `${config.PREFIX}help`,

  async execute(message) {
    const client = message.client;

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.PRIMARY)
      .setTitle('Hxsk Bot Commands')
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `Prefix: ${config.PREFIX}  •  e.g. ${config.PREFIX}ping` });

    for (const [category, commands] of client.categories) {
      const label = CATEGORY_LABELS[category] || category;
      const list = commands.map(cmd => `\`${cmd.usage || config.PREFIX + cmd.name}\` / ${cmd.description}`).join('\n');
      if (list) embed.addFields({ name: label, value: list });
    }

    await message.reply({ embeds: [embed] });
  },
};
