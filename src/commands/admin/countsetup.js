const { ApplicationCommandOptionType, ChannelType, EmbedBuilder } = require("discord.js");
const CountGame = require("@schemas/countGame");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "setcount",
  description: "Set the channel for the counting game",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<#channel>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "channel",
        description: "Channel to use for counting game",
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!channel || channel.type !== ChannelType.GuildText)
      return message.reply("Please mention a valid text channel.");

    await setCountingChannel(message.guild.id, channel.id);
    message.safeReply(`✅ Counting channel set to ${channel}`);
  },

  async interactionRun(interaction) {
    const channel = interaction.options.getChannel("channel");
    await setCountingChannel(interaction.guild.id, channel.id);
    await interaction.followUp(`✅ Counting channel set to ${channel}`);
  },
};

async function setCountingChannel(guildId, channelId) {
  let game = await CountGame.findOne({ guildId });
  if (!game) {
    game = new CountGame({ guildId, channelId });
  } else {
    game.channelId = channelId;
  }
  await game.save();
}
