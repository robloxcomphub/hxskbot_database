require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { connectDB } = require('./utils/db');

// ---------------------------------------------------------------------------
// Keep-alive webserver (Render web services need something listening on PORT)
// ---------------------------------------------------------------------------
const app = express();
app.get('/', (req, res) => res.send('Hxsk Bot is running!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Webserver running on port ${PORT}`));

// ---------------------------------------------------------------------------
// Discord client
// ---------------------------------------------------------------------------
// NOTE: MessageContent is a *privileged* intent. It must also be turned on
// in the Discord Developer Portal (Bot page -> Privileged Gateway Intents
// -> Message Content Intent) or the bot will connect but never see any
// message text, meaning "." commands won't work.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.categories = new Map(); // category name -> array of command modules

// ---------------------------------------------------------------------------
// Command loader — reads every commands/<category>/*.js file
// ---------------------------------------------------------------------------
const commandsPath = path.join(__dirname, 'commands');
const categoryFolders = fs.readdirSync(commandsPath).filter(f =>
  fs.statSync(path.join(commandsPath, f)).isDirectory(),
);

for (const category of categoryFolders) {
  const categoryPath = path.join(commandsPath, category);
  const commandFiles = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));
  const categoryCommands = [];

  for (const file of commandFiles) {
    const command = require(path.join(categoryPath, file));
    if (!command?.name || !command?.execute) {
      console.warn(`⚠️ Skipping ${file} — missing "name" or "execute" export.`);
      continue;
    }
    client.commands.set(command.name, command);
    categoryCommands.push(command);
  }

  client.categories.set(category, categoryCommands);
}

console.log(`📦 Loaded ${client.commands.size} command(s) across ${categoryFolders.length} categories.`);

// ---------------------------------------------------------------------------
// Event loader — reads every events/*.js file
// ---------------------------------------------------------------------------
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

console.log(`📦 Loaded ${eventFiles.length} event(s).`);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
client.on('error', error => console.error('❌ Discord client error:', error));
client.on('warn', warning => console.warn('⚠️ Discord client warning:', warning));
process.on('unhandledRejection', error => console.error('❌ Unhandled promise rejection:', error));

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN not found in environment variables.');
  process.exit(1);
}

(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.error('   Set MONGODB_URI in your environment variables — see README.md for setup steps.');
    process.exit(1);
  }

  client.login(token).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
  });
})();
