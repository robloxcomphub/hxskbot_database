const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { resolveUser } = require('../../utils/resolve');

module.exports = {
  name: 'avatar',
  description: "View a member's avatar",
  usage: `${config.PREFIX}avatar [@user|id]`,

  async execute(message, args) {
    const targetUser = args[0]
      ? (await resolveUser(message.client, args)) || message.author
      : message.author;

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.PRIMARY)
      .setTitle(`${targetUser.tag}'s Avatar`)
      .setImage(targetUser.displayAvatarURL({ size: 1024 }));

    await message.reply({ embeds: [embed] });
  },
};
