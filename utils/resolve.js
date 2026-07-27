const MENTION_OR_ID = /^(?:<@!?(\d+)>|(\d{17,20}))$/;

/** Extracts a snowflake ID from a mention (<@id> / <@!id>) or a raw ID string. */
function extractId(arg) {
  if (!arg) return null;
  const match = MENTION_OR_ID.exec(arg.trim());
  if (!match) return null;
  return match[1] || match[2];
}

/** Resolves args[0] to a guild member. Returns null if not found/not in server. */
async function resolveMember(guild, args) {
  const id = extractId(args[0]);
  if (!id) return null;
  return guild.members.fetch(id).catch(() => null);
}

/** Resolves args[0] to a Discord user (works even if they've left the server). */
async function resolveUser(client, args) {
  const id = extractId(args[0]);
  if (!id) return null;
  return client.users.fetch(id).catch(() => null);
}

/** Everything after the first arg (the user), joined back into a reason string. */
function reasonFrom(args, fallback = 'No reason provided') {
  const reason = args.slice(1).join(' ').trim();
  return reason || fallback;
}

module.exports = { extractId, resolveMember, resolveUser, reasonFrom };
