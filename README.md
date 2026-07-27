# Hxsk Bot

A Discord bot with "." prefix moderation commands (with DM + log-channel
notifications), a full button-based giveaway system, a vouch/reputation
system, and general/utility commands — all backed by a free MongoDB Atlas
database so data survives restarts and redeploys.

## Commands

Prefix: `.` (change it in `config.js` under `PREFIX` if you want a different one)

### 🛡️ Moderation
All moderation actions DM the offender and log to `<#1530929199164952659>`.

| Command | Description |
|---|---|
| `.ban <@user\|id> [reason]` | Ban a member |
| `.unban <user_id> [reason]` | Unban by user ID |
| `.kick <@user\|id> [reason]` | Kick a member |
| `.timeout <@user\|id> <duration> [reason]` | Timeout a member (e.g. `10m`, `2h`, `1d`) |
| `.untimeout <@user\|id> [reason]` | Remove an active timeout |
| `.warn <@user\|id> <reason>` | Warn a member (tracked per-user) |
| `.warnings view\|clear <@user\|id>` | View or clear a member's warnings |
| `.purge <amount> [@user]` | Bulk delete recent messages |

### 🎉 Giveaway
Members with role `<@&1530338067196678284>` get **+1 extra entry** automatically.

| Command | Description |
|---|---|
| `.gstart <duration> <winners> <prize> [\| extra info] [#channel] [@host]` | Start a giveaway |
| `.gend <message_id>` | End a giveaway early and draw winners |
| `.greroll <message_id>` | Reroll winners on an ended giveaway |
| `.glist` | List active giveaways |

Example: `.gstart 1h 1 Nitro Classic | 5 TITANIC GWS IN BIO #giveaways`

Entering is done by clicking the **🎉 Enter Giveaway** button on the giveaway
embed — no command needed. Clicking again removes your entry.

### 🙌 Vouches
Anyone can vouch for anyone else (e.g. after a trade or a good interaction).

| Command | Description |
|---|---|
| `.vouch <@user\|id> [reason]` | Give a member a vouch |
| `.vouches [@user\|id]` | View a member's vouch count + recent vouches (defaults to yourself) |
| `.vouchboard` | Top 10 most-vouched members in the server |

There's no cooldown or one-per-person limit built in — if you want to
prevent someone from spamming vouches for the same person, that'd be a
small addition to `commands/general/vouch.js`.

### ✨ General
`.ping` · `.help` · `.userinfo [@user]` · `.serverinfo` · `.avatar [@user]` · `.roleinfo <role>` · `.membercount` · `.uptime`

## Setup

### 1. Install dependencies
```
npm install
```

### 2. Set up your free MongoDB database
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign up (no credit card required).
2. Click **Build a Database** → choose the **M0 Free** tier → pick any cloud provider/region → **Create**.
3. Under **Security → Database Access**, create a database user with a username and password (save these).
4. Under **Security → Network Access**, click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`). This is required since Render's servers use dynamic IPs.
5. Go to **Database → Connect** on your cluster → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with the credentials from step 3.

The M0 tier is free forever — 512 MB storage, no time limit, no card on file. Plenty for warnings/giveaways/vouches on a normal-sized server.

### 3. Create a `.env` file (copy `.env.example`)
```
DISCORD_TOKEN=your_bot_token
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```
Get the Discord token from https://discord.com/developers/applications → your app → **Bot** page.

### 4. Enable the required privileged intents
In the Developer Portal, go to your app → **Bot** → *Privileged Gateway Intents* → enable BOTH:
- **Server Members Intent**
- **Message Content Intent** (required for the bot to read `.command` text at all)

### 5. Invite the bot
OAuth2 URL Generator → scope `bot` only → permissions: `Ban Members`,
`Kick Members`, `Moderate Members`, `Manage Messages`, `Manage Guild`,
`Send Messages`, `Embed Links`, `Read Message History`, `View Channels`.

### 6. Run it
```
npm start
```
On first run, the database and its collections (`giveaways`, `warnings`, `vouches`) are created automatically the first time each is written to — nothing to set up manually inside MongoDB itself.

## Deploying on Render

1. Push this project to a GitHub repo — make sure `commands/`, `events/`,
   and `utils/` all show up as folders on the repo page, not just loose
   files. (This is the #1 cause of a failed deploy.)
2. In Render, create a **Web Service** from that repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free
3. Add environment variables in the Render dashboard: `DISCORD_TOKEN` and `MONGODB_URI`.
4. Double-check the privileged intents (step 4 above) are enabled in the
   Discord Developer Portal.
5. Render's free web services spin down after ~15 minutes without an HTTP
   request. The built-in Express server on `/` gives something for a free
   uptime pinger (e.g. UptimeRobot, checking every 5–14 min) to hit so the
   bot stays connected.

With MongoDB Atlas in place, your warnings/giveaways/vouches now persist
across redeploys and restarts — that was the one gap in the JSON-file
version.

## Project structure

```
index.js                  Bot entry point — connects to MongoDB, loads commands/events, starts webserver
config.js                  Prefix, channel/role IDs, and colors, all in one place
commands/
  moderation/               ban, unban, kick, timeout, untimeout, warn, warnings, purge
  giveaway/                  gstart, gend, greroll, glist
  general/                   ping, help, userinfo, serverinfo, avatar, roleinfo, membercount, uptime, vouch, vouches, vouchboard
events/
  ready.js                  Sets presence, starts the giveaway end-checker
  messageCreate.js          Parses "." commands and routes them
  interactionCreate.js      Routes giveaway button clicks
utils/
  db.js                      MongoDB Atlas connection helper
  modLog.js                  DM + mod-log-channel helper
  giveawayManager.js        Winner drawing and giveaway lifecycle (MongoDB-backed)
  giveawayEmbed.js           Builds the giveaway embed/button
  duration.js                Parses "1d12h"-style durations
  resolve.js                  Resolves mentions/IDs and reasons out of message args
```

### MongoDB collections
| Collection | Purpose |
|---|---|
| `giveaways` | One document per giveaway (`_id` = message ID) |
| `warnings` | One document per warning issued |
| `vouches` | One document per vouch given |
