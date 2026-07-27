const { getGiveaway, saveGiveaway } = require('../utils/giveawayManager');
const { buildGiveawayEmbed, buildEnterRow } = require('../utils/giveawayEmbed');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Hxsk Bot uses "." prefix commands, not slash commands — the only
    // interactions we handle here are giveaway entry button clicks.
    if (interaction.isButton() && interaction.customId.startsWith('giveaway_enter_')) {
      return handleGiveawayEntry(interaction);
    }
  },
};

async function handleGiveawayEntry(interaction) {
  const messageId = interaction.customId.replace('giveaway_enter_', '');
  const giveaway = await getGiveaway(messageId);

  if (!giveaway) {
    return interaction.reply({ content: '❌ This giveaway no longer exists.', ephemeral: true });
  }
  if (giveaway.ended) {
    return interaction.reply({ content: '⏰ This giveaway has already ended.', ephemeral: true });
  }

  const userId = interaction.user.id;
  const alreadyEntered = giveaway.entries.includes(userId);

  if (alreadyEntered) {
    giveaway.entries = giveaway.entries.filter(id => id !== userId);
  } else {
    giveaway.entries.push(userId);
  }

  await saveGiveaway(giveaway);

  await interaction.reply({
    content: alreadyEntered ? '❎ You left the giveaway.' : "🎉 You're entered! Good luck!",
    ephemeral: true,
  });

  await interaction.message
    .edit({ embeds: [buildGiveawayEmbed(giveaway)], components: [buildEnterRow(messageId)] })
    .catch(() => null);
}
