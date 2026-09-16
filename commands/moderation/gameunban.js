const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { logAction } = require('../../utils/modLog');
const { getUserIdFromUsername, setGameBan } = require('../../utils/roblox');

module.exports = {
  name: 'gameunban',
  description: 'Lift a Roblox game ban issued with .gameban',
  usage: `${config.PREFIX}gameunban <roblox username|userId> [reason]`,
  permissions: [PermissionFlagsBits.BanMembers],

  async execute(message, args) {
    const target = args[0];
    if (!target) {
      return message.reply(`❌ Usage: \`${this.usage}\``);
    }
    const reason = args.slice(1).join(' ').trim() || 'No reason provided';

    let robloxUserId, robloxUsername;
    if (/^\d+$/.test(target)) {
      robloxUserId = target;
      robloxUsername = target;
    } else {
      let lookup;
      try {
        lookup = await getUserIdFromUsername(target);
      } catch (err) {
        console.error(err);
        return message.reply('❌ Failed to look up that Roblox username. Try again in a moment.');
      }
      if (!lookup) {
        return message.reply(`❌ No Roblox user found named **${target}**.`);
      }
      robloxUserId = lookup.id;
      robloxUsername = lookup.name;
    }

    try {
      await setGameBan(robloxUserId, {
        active: false,
        privateReason: `${reason} | Unbanned by ${message.author.tag} via Discord`,
        displayReason: reason,
      });
    } catch (err) {
      console.error(err);
      return message.reply(
        '❌ Failed to lift that ban. Double-check `ROBLOX_API_KEY` / `ROBLOX_UNIVERSE_ID` and try again.',
      );
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(config.COLORS.SUCCESS)
      .setDescription(`✅ **${robloxUsername}** (\`${robloxUserId}\`) has been unbanned from the game.`);

    await message.reply({ embeds: [resultEmbed] });

    await logAction(message.client, {
      action: '✅ Game Unban',
      target: { tag: `${robloxUsername} (Roblox)`, id: robloxUserId },
      moderator: message.author,
      reason,
      color: config.COLORS.SUCCESS,
    });
  },
};
