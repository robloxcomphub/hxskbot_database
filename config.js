// Central config for Hxsk Bot.
// IDs that are specific to your server live here so you don't have to
// hunt through every command file to change them.

module.exports = {
  // The character(s) that trigger a command, e.g. ".ban @user spamming"
  PREFIX: '.',

  // Channel that receives every moderation action log embed.
  MOD_LOG_CHANNEL_ID: '1530929199164952659',

  // Members with this role get +1 extra giveaway entry automatically.
  GIVEAWAY_BONUS_ROLE_ID: '1530338067196678284',

  // Brand colors used across embeds.
  COLORS: {
    PRIMARY: 0x2B2D31,
    SUCCESS: 0x57F287,
    DANGER: 0xED4245,
    WARNING: 0xFEE75C,
    GIVEAWAY: 0x9B59B6,
  },

  // Default emoji used to enter giveaways via button.
  GIVEAWAY_EMOJI: '🎉',
};
