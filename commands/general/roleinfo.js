const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

const ROLE_MENTION = /^<@&(\d+)>$/;

module.exports = {
  name: 'roleinfo',
  description: 'View information about a role',
  usage: `${config.PREFIX}roleinfo <@role|id|name>`,

  async execute(message, args) {
    if (!args.length) {
      return message.reply(`❌ Usage: \`${this.usage}\``);
    }

    const input = args.join(' ').trim();
    const mentionMatch = ROLE_MENTION.exec(args[0]);

    let role = null;
    if (mentionMatch) {
      role = message.guild.roles.cache.get(mentionMatch[1]);
    } else if (/^\d{17,20}$/.test(args[0])) {
      role = message.guild.roles.cache.get(args[0]);
    } else {
      role = message.guild.roles.cache.find(r => r.name.toLowerCase() === input.toLowerCase());
    }

    if (!role) {
      return message.reply("❌ Couldn't find that role.");
    }

    const embed = new EmbedBuilder()
      .setColor(role.color || config.COLORS.PRIMARY)
      .setTitle(role.name)
      .addFields(
        { name: 'Role ID', value: role.id, inline: true },
        { name: 'Members', value: `${role.members.size}`, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>` },
      );

    await message.reply({ embeds: [embed] });
  },
};
