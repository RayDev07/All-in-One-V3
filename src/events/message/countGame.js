const { EmbedBuilder } = require("discord.js");
const CountGame = require("@schemas/countGame");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;

  const game = await CountGame.findOne({ guildId: message.guild.id });
  if (!game || message.channel.id !== game.channelId) return;

  const content = message.content.trim();
  const num = parseInt(content, 10);

  if (isNaN(num)) return;

  const correctNext = game.lastCount + 1;
  const sameUser = game.lastUserId === message.author.id;
  const wrongCount = num !== correctNext;

  if (wrongCount || sameUser) {
    await message.react("<a:wrong:1430938922405462016>");

    const embed = new EmbedBuilder()
      .setTitle("❌ Count Failed!")
      .setDescription(
        `${message.author} ruined the count at **${game.lastCount}**.\nThe next number is **1**.`
      )
      .setColor("Red")
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    game.lastCount = 0;
    game.lastUserId = null;
    await game.save();
    return;
  }

  // correct number
  await message.react("<a:tick:1430938834186666108>");

  game.lastCount = num;
  game.lastUserId = message.author.id;
  await game.save();
};
