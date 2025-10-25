/**
 * Skip the current song in a guild
 * @param {import("discord.js").Client} client
 * @param {string} guildId
 * @returns {string} Response message
 */
function skipSong(client, guildId) {
  const player = client.musicManager.getPlayer(guildId);

  if (!player?.queue?.current) return "⏯️ There is no song currently being played";

  const { title } = player.queue.current;
  return player.queue.next() ? `⏯️ ${title} was skipped.` : "⏯️ There is no song to skip.";
}

module.exports = { skipSong };
