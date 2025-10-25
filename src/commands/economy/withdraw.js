const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "w",
  description: "Withdraw coins from your bank",
  category: "ECONOMY",
  botPermissions: ["EmbedLinks"],

  command: {
    enabled: true,
    minArgsCount: 1, // expects coins argument
  },

  slashCommand: {
    enabled: true,
    options: [
      {
        name: "coins",
        description: "Number of coins to withdraw",
        type: 4, // ApplicationCommandOptionType.Integer
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const coins = parseInt(args[0]);
    if (isNaN(coins) || coins <= 0) return message.safeReply("Please enter a valid amount of coins to withdraw");

    const userDb = await getUser(message.author);
    if (coins > userDb.bank) return message.safeReply(`You only have ${userDb.bank}${ECONOMY.CURRENCY} coins in your bank`);

    userDb.bank -= coins;
    userDb.coins += coins;
    await userDb.save();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ name: "New Balance" })
      .setThumbnail(message.author.displayAvatarURL())
      .addFields(
        { name: "Wallet", value: `${userDb.coins}${ECONOMY.CURRENCY}`, inline: true },
        { name: "Bank", value: `${userDb.bank}${ECONOMY.CURRENCY}`, inline: true },
        { name: "Net Worth", value: `${userDb.coins + userDb.bank}${ECONOMY.CURRENCY}`, inline: true }
      );

    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const coins = interaction.options.getInteger("coins");
    if (isNaN(coins) || coins <= 0) return interaction.followUp("Please enter a valid amount of coins to withdraw");

    const userDb = await getUser(interaction.user);
    if (coins > userDb.bank) return interaction.followUp(`You only have ${userDb.bank}${ECONOMY.CURRENCY} coins in your bank`);

    userDb.bank -= coins;
    userDb.coins += coins;
    await userDb.save();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ name: "New Balance" })
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: "Wallet", value: `${userDb.coins}${ECONOMY.CURRENCY}`, inline: true },
        { name: "Bank", value: `${userDb.bank}${ECONOMY.CURRENCY}`, inline: true },
        { name: "Net Worth", value: `${userDb.coins + userDb.bank}${ECONOMY.CURRENCY}`, inline: true }
      );

    await interaction.followUp({ embeds: [embed] });
  },
};
