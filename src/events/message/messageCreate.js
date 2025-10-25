const { commandHandler, automodHandler, statsHandler } = require("@src/handlers");
const { PREFIX_COMMANDS } = require("@root/config");
const { getSettings } = require("@schemas/Guild");
const { EmbedBuilder } = require("discord.js");
const CountGame = require("@schemas/countGame");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;
  const settings = await getSettings(message.guild);

  // Command handler
  let isCommand = false;
  if (PREFIX_COMMANDS.ENABLED) {
    // Respond to bot mention
    if (message.content.includes(`${client.user.id}`)) {
      message.channel.safeSend(`> My prefix is \`${settings.prefix}\``);
    }

    // Prefix command execution
    if (message.content && message.content.startsWith(settings.prefix)) {
      const invoke = message.content.replace(`${settings.prefix}`, "").split(/\s+/)[0];
      const cmd = client.getCommand(invoke);
      if (cmd) {
        isCommand = true;
        commandHandler.handlePrefixCommand(message, cmd, settings);
      }
    }
  }

  // Stats tracking
  if (settings.stats.enabled) await statsHandler.trackMessageStats(message, isCommand, settings);

  // Only run automod and counting game if not a command
  if (!isCommand) {
    await automodHandler.performAutomod(message, settings);
    await handleCountingGame(client, message);
  }
};

/**
 * Counting Game Logic
 */
async function handleCountingGame(client, message) {
  const game = await CountGame.findOne({ guildId: message.guild.id });
  if (!game || message.channel.id !== game.channelId) return;

  const content = message.content.trim();
  const num = parseInt(content, 10);

  if (isNaN(num)) return;

  const correctNext = game.lastCount + 1;
  const sameUser = game.lastUserId === message.author.id;
  const wrongCount = num !== correctNext;

  if (wrongCount || sameUser) {
    try {
      await message.react("<a:wrong:1430938922405462016>");
    } catch {
      await message.react("❌");
    }

    const embed = new EmbedBuilder()
      .setTitle("❌ Count Failed!")
      .setDescription(`${message.author} ruined the count at **${game.lastCount}**.\nRestarting from **1**.`)
      .setColor("Red")
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    game.lastCount = 0;
    game.lastUserId = null;
    await game.save();
    return;
  }

  // Correct count
  try {
    await message.react("<a:tick:1430938834186666108>");
  } catch {
    await message.react("✅");
  }

  game.lastCount = num;
  game.lastUserId = message.author.id;
  await game.save();
}
