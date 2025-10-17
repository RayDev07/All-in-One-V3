const { EmbedBuilder } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "beg",
  description: "beg from someone",
  category: "ECONOMY",
  cooldown: 15, // ✅ cooldown changed to 15 seconds
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    const allowedUserId = "1380834797630259322"; // ✅ only this user can use the command

    if (message.author.id !== allowedUserId) {
      return message.safeReply("❌ You don't have permission to use this command.");
    }

    const response = await beg(message.author);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const allowedUserId = "1380834797630259322"; // ✅ same restriction for slash command

    if (interaction.user.id !== allowedUserId) {
      return interaction.followUp("❌ You don't have permission to use this command.");
    }

    const response = await beg(interaction.user);
    await interaction.followUp(response);
  },
};

async function beg(user) {
  const users = [
    "PewDiePie",
    "T-Series",
    "Sans",
    "RLX",
    "Pro Gamer 711",
    "Zenitsu",
    "Jake Paul",
    "Kaneki Ken",
    "KSI",
    "Naruto",
    "Mr. Beast",
    "Ur Mom",
    "A Broke Person",
    "Giyu Tomiaka",
    "Bejing Embacy",
    "A Random Asian Mom",
    "Ur Step Sis",
    "Jin Mori",
    "Sakura (AKA Trash Can)",
    "Hammy The Hamster",
    "Kakashi Sensei",
    "Minato",
    "Tanjiro",
    "ZHC",
    "The IRS",
    "Joe Mama",
  ];

  // ✅ Proper random range formula
  const amount =
    Math.floor(Math.random() * (ECONOMY.MAX_BEG_AMOUNT - ECONOMY.MIN_BEG_AMOUNT + 1)) +
    ECONOMY.MIN_BEG_AMOUNT;

  const userDb = await getUser(user);
  userDb.coins += amount;
  await userDb.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: `${user.username}`, iconURL: user.displayAvatarURL() })
    .setDescription(
      `**${users[Math.floor(Math.random() * users.length)]}** donated you **${amount}** ${ECONOMY.CURRENCY}\n` +
        `**Updated Balance:** **${userDb.coins}** ${ECONOMY.CURRENCY}`
    );

  return { embeds: [embed] };
}
