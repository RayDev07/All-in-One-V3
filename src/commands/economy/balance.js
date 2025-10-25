const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "b", // standalone command
  description: "Check your balance",
  category: "ECONOMY",
  botPermissions: ["EmbedLinks"],

  command: {
    enabled: true,
    minArgsCount: 0, // optional user argument
  },

  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "User to check balance",
        type: 6, // ApplicationCommandOptionType.User
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const user = args[0] ? await message.guild.resolveMember(args[0]) : message.member;
    if (!user) return message.safeReply("Invalid user.");

    const economy = await getUser(user.user);
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ name: user.user.username })
      .setThumbnail(user.user.displayAvatarURL())
      .addFields(
        { name: "Wallet", value: `${economy?.coins || 0}${ECONOMY.CURRENCY}`, inline: true },
        { name: "Bank", value: `${economy?.bank || 0}${ECONOMY.CURRENCY}`, inline: true },
        { name: "Net Worth", value: `${(economy?.coins || 0) + (economy?.bank || 0)}${ECONOMY.CURRENCY}`, inline: true }
      );

    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const economy = await getUser(user);

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ name: user.username })
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Wallet", value: `${economy?.coins || 0}${ECONOMY.CURRENCY}`, inline: true },
        { name: "Bank", value: `${economy?.bank || 0}${ECONOMY.CURRENCY}`, inline: true },
        { name: "Net Worth", value: `${(economy?.coins || 0) + (economy?.bank || 0)}${ECONOMY.CURRENCY}`, inline: true }
      );

    await interaction.followUp({ embeds: [embed] });
  },
};
