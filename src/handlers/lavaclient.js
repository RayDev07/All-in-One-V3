const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Cluster } = require("lavaclient");
const prettyMs = require("pretty-ms");
const { load, SpotifyItemType } = require("@lavaclient/spotify");
require("@lavaclient/queue/register");

/**
 * @param {import("@structures/BotClient")} client
 */
module.exports = (client) => {
  // Load Spotify support
  load({
    client: {
      id: process.env.SPOTIFY_CLIENT_ID,
      secret: process.env.SPOTIFY_CLIENT_SECRET,
    },
    autoResolveYoutubeTracks: false,
    loaders: [
      SpotifyItemType.Album,
      SpotifyItemType.Artist,
      SpotifyItemType.Playlist,
      SpotifyItemType.Track,
    ],
  });

  const lavaclient = new Cluster({
    nodes: client.config.MUSIC.LAVALINK_NODES,
    sendGatewayPayload: (id, payload) => client.guilds.cache.get(id)?.shard?.send(payload),
  });

  // Voice updates
  client.ws.on("VOICE_SERVER_UPDATE", (data) => lavaclient.handleVoiceUpdate(data));
  client.ws.on("VOICE_STATE_UPDATE", (data) => lavaclient.handleVoiceUpdate(data));

  // Node events
  lavaclient.on("nodeConnect", (node) => client.logger.log(`Node "${node.id}" connected`));
  lavaclient.on("nodeDisconnect", (node) => client.logger.log(`Node "${node.id}" disconnected`));
  lavaclient.on("nodeError", (node, error) => client.logger.error(`Node "${node.id}" error: ${error.message}`, error));
  lavaclient.on("nodeDebug", (node, message) => client.logger.debug(`Node "${node.id}" debug: ${message}`));

  // Track start
  lavaclient.on("nodeTrackStart", (_node, queue, song) => {
    sendNowPlaying(queue, song);
  });

  // Queue finished
  lavaclient.on("nodeQueueFinish", async (_node, queue) => {
    queue.data.channel.safeSend("Queue has ended.");
    const player = client.musicManager.getPlayer(queue.player.guildId);
    if (player) await client.musicManager.destroyPlayer(queue.player.guildId);
  });

  // Send or update Now Playing embed with buttons
  async function sendNowPlaying(queue, song) {
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Now Playing" })
      .setColor(client.config.EMBED_COLORS.BOT_EMBED)
      .setDescription(`[${song.title}](${song.uri})`)
      .setFooter({ text: `Requested By: ${song.requester}` });

    if (song.sourceName === "youtube") {
      const identifier = song.identifier;
      embed.setThumbnail(`https://img.youtube.com/vi/${identifier}/hqdefault.jpg`);
    }

    embed.setFields([
      { name: "Song Duration", value: "`" + prettyMs(song.length, { colonNotation: true }) + "`", inline: true },
      queue.tracks.length > 0
        ? { name: "Position in Queue", value: (queue.tracks.length + 1).toString(), inline: true }
        : null,
    ].filter(Boolean));

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("music_stop").setLabel("⏹️ Stop").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("music_play_pause").setLabel("⏯️ Play/Pause").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("music_next").setLabel("⏭️ Next").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("music_vol_down").setLabel("🔉 Vol -").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("music_vol_up").setLabel("🔊 Vol +").setStyle(ButtonStyle.Secondary)
    );

    // If embed already exists, edit it
    if (queue.data.messageId) {
      const msg = await queue.data.channel.messages.fetch(queue.data.messageId).catch(() => null);
      if (msg) return msg.edit({ embeds: [embed], components: [buttons] });
    }

    // Otherwise send new message and store ID
    const msg = await queue.data.channel.safeSend({ embeds: [embed], components: [buttons] });
    queue.data.messageId = msg.id;
  }

  // Music button interactions
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("music_")) return;

    const player = client.musicManager.getPlayer(interaction.guildId);
    if (!player) return interaction.reply({ content: "No music is playing.", ephemeral: true });

    switch (interaction.customId) {
      case "music_stop": {
        const player = client.musicManager.getPlayer(interaction.guildId);
        if (!player) return interaction.reply({ content: "No music is playing.", ephemeral: true });

    // Clear queue and stop track
        player.queue.clear();
        await player.stop();

    // Force the bot to leave VC
        const guild = client.guilds.cache.get(interaction.guildId);
        const botMember = guild?.members.me; // bot's GuildMember object
        if (botMember?.voice.channel) {
            await botMember.voice.disconnect(); // <-- directly disconnect from VC
        }

    // Destroy the player locally
        await client.musicManager.destroyPlayer(interaction.guildId);

        await interaction.reply({ content: "⏹️ Music stopped and bot disconnected.", ephemeral: true });
        break;
      }
      case "music_play_pause":
        if (player.paused) player.resume();
        else player.pause(true);
        await interaction.reply({ content: player.paused ? "⏸️ Paused" : "▶️ Resumed", ephemeral: true });
        break;

      case "music_next": {
        const { skipSong } = require("../helpers/musicHelpers");
        const response = skipSong(client, interaction.guildId);

        const updatedPlayer = client.musicManager.getPlayer(interaction.guildId);
        if (!updatedPlayer || updatedPlayer.queue.tracks.length === 0) {
          if (updatedPlayer) await client.musicManager.destroyPlayer(interaction.guildId);
          await interaction.reply({ content: response + "\nQueue is empty, bot disconnected.", ephemeral: true });
        } else {
          await interaction.reply({ content: response, ephemeral: true });
        }
        break;
      }

      case "music_vol_down":
        player.setVolume(Math.max(player.volume - 10, 10));
        await interaction.reply({ content: `🔉 Volume: ${player.volume}%`, ephemeral: true });
        break;

      case "music_vol_up":
        player.setVolume(Math.min(player.volume + 10, 100));
        await interaction.reply({ content: `🔊 Volume: ${player.volume}%`, ephemeral: true });
        break;
    }
  });

  return lavaclient;
};
