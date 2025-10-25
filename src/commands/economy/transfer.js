const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { ECONOMY, EMBED_COLORS } = require("@root/config");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "t",
  description: "Transfer coins to another user",
  category: "ECONOMY",
  botPermissions: ["EmbedLinks"],

  command: {
    enabled: true,
    minArgsCount: 2, // expects target and coins
  },

  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "The user to transfer coins to",
        type: 6, // ApplicationCommandOptionType.User
        required: true,
      },
      {
        name: "coins",
        description: "The amount of coins to transfer",
        type: 4, // ApplicationCommandOptionType.Integer
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    if (args.length < 2) return message.safeReply("Provide a valid user and amount of coins to transfer.");

    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply("Provide a valid user to transfer coins to.");
    if (target.user.bot) return message.safeReply("You cannot transfer coins to bots!");
    if (target.id === message.author.id) return message.safeReply("You cannot transfer coins to yourself!");

    const coins = parseInt(args[1]);
    if (isNaN(coins) || coins <= 0) return message.safeReply("Please enter a valid amount of coins to transfer.");

    const userDb = await getUser(message.author);
    if (userDb.bank < coins) {
      return message.safeReply(
        `Insufficient bank balance! You only have ${userDb.bank}${ECONOMY.CURRENCY} in your bank account.${
          userDb.coins > 0 ? "\nYou must deposit your coins in bank before you can transfer" : ""
        }`
      );
    }

    const targetDb = await getUser(target.user);
    userDb.bank -= coins;
    targetDb.bank += coins;

    await userDb.save();
    await targetDb.save();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ name: "Updated Balance" })
      .setDescription(`You have successfully transferred ${coins}${ECONOMY.CURRENCY} to ${target.user.username}`)
      .setTimestamp();

    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    const target = interaction.options.getUser("user");
    const coins = interaction.options.getInteger("coins");

    if (target.bot) return interaction.followUp("You cannot transfer coins to bots!");
    if (target.id === interaction.user.id) return interaction.followUp("You cannot transfer coins to yourself!");
    if (isNaN(coins) || coins <= 0) return interaction.followUp("Please enter a valid amount of coins to transfer.");

    const userDb = await getUser(interaction.user);
    if (userDb.bank < coins) {
      return interaction.followUp(
        `Insufficient bank balance! You only have ${userDb.bank}${ECONOMY.CURRENCY} in your bank account.${
          userDb.coins > 0 ? "\nYou must deposit your coins in bank before you can transfer" : ""
        }`
      );
    }

    const targetDb = await getUser(target);
    userDb.bank -= coins;
    targetDb.bank += coins;

    await userDb.save();
    await targetDb.save();

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ name: "Updated Balance" })
      .setDescription(`You have successfully transferred ${coins}${ECONOMY.CURRENCY} to ${target.username}`)
      .setTimestamp();

    await interaction.followUp({ embeds: [embed] });
  },
};
