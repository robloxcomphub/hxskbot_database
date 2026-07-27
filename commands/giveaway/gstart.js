const { PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { parseDuration, formatDuration } = require('../../utils/duration');
const { buildGiveawayEmbed, buildEnterRow } = require('../../utils/giveawayEmbed');
const { saveGiveaway } = require('../../utils/giveawayManager');

const CHANNEL_MENTION = /^<#(\d+)>$/;
const USER_MENTION = /^<@!?(\d+)>$/;

module.exports = {
  name: 'gstart',
  description: 'Start a new giveaway',
  usage: `${config.PREFIX}gstart <duration> <winners> <prize> [| extra info] [#channel] [@host]`,
  permissions: [PermissionFlagsBits.ManageGuild],

  async execute(message, args) {
    if (args.length < 3) {
      return message.reply(`❌ Usage: \`${this.usage}\`\nExample: \`${config.PREFIX}gstart 1h 1 Nitro Classic | 5 TITANIC GWS IN BIO\``);
    }

    // Pull an optional #channel mention and @host mention out of the args,
    // wherever they appear, so the rest can be read positionally.
    const remaining = [];
    let channel = message.channel;
    let host = message.author;

    for (const token of args) {
      const channelMatch = CHANNEL_MENTION.exec(token);
      const userMatch = USER_MENTION.exec(token);

      if (channelMatch) {
        const found = await message.guild.channels.fetch(channelMatch[1]).catch(() => null);
        if (found) channel = found;
        continue;
      }
      if (userMatch) {
        const found = await message.client.users.fetch(userMatch[1]).catch(() => null);
        if (found) host = found;
        continue;
      }
      remaining.push(token);
    }

    const durationStr = remaining[0];
    const winnerCount = Number(remaining[1]);
    const prizeAndInfo = remaining.slice(2).join(' ').trim();

    if (!prizeAndInfo) {
      return message.reply(`❌ Usage: \`${this.usage}\``);
    }
    if (!Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > 20) {
      return message.reply('❌ Winners must be a whole number between 1 and 20.');
    }

    const ms = parseDuration(durationStr);
    if (!ms) {
      return message.reply("❌ Invalid duration. Try something like `30m`, `1h`, `1d`, or `1d12h`.");
    }

    // "Prize | extra info" — split on the first pipe if present.
    const [prize, extraInfo] = prizeAndInfo.split('|').map(s => s.trim());

    const giveaway = {
      guildId: message.guild.id,
      channelId: channel.id,
      messageId: null,
      prize,
      winnerCount,
      hostId: host.id,
      extraInfo: extraInfo || null,
      endTimestamp: Date.now() + ms,
      entries: [],
      ended: false,
      winners: [],
    };

    let sent;
    try {
      sent = await channel.send({
        content: '🎉 **GIVEAWAY** 🎉',
        embeds: [buildGiveawayEmbed(giveaway)],
        components: [buildEnterRow('pending')],
      });
    } catch (err) {
      console.error(err);
      return message.reply('❌ Failed to post the giveaway. Do I have permission to send messages there?');
    }

    giveaway.messageId = sent.id;
    await saveGiveaway(giveaway);
    await sent.edit({ components: [buildEnterRow(sent.id)] }).catch(() => null);

    await message.reply(`✅ Giveaway for **${prize}** started in ${channel}! Ends in **${formatDuration(ms)}**.`);
  },
};
