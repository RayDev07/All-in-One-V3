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
  cooldown: 15,
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },
  
  
  async messageRun(message, args) {
    const allowedUserId = "1380834797630259322"; // your specified user ID

    // Check user access
    if (message.author.id !== allowedUserId) {
      return message.safeReply("❌ You are not allowed to use this command.");
    }

    const response = await beg(message.author);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const allowedUserId = "1380834797630259322"; // your specified user ID

    // Check user access
    if (interaction.user.id !== allowedUserId) {
      return interaction.followUp({ content: "❌ You are not allowed to use this command.", ephemeral: true });
    }

    const response = await beg(interaction.user);
    await interaction.followUp(response);
  },
};


async function beg(user) {
  const donors = [
    "PewDiePie",
    "T-Series",
    "Sans",
    "RLX",
    "Pro Gamer 711",
    "Zenix",
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

  const amount =
    Math.floor(Math.random() * (ECONOMY.MAX_BEG_AMOUNT - ECONOMY.MIN_BEG_AMOUNT + 1)) +
    ECONOMY.MIN_BEG_AMOUNT;

  const userDb = await getUser(user);
  userDb.coins += amount;
  await userDb.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setDescription(
      `**${donors[Math.floor(Math.random() * donors.length)]}** donated you **${amount}** ${ECONOMY.CURRENCY}\n` +
        `**Updated Balance:** **${userDb.coins}** ${ECONOMY.CURRENCY}`
    );

  return { embeds: [embed] };
}
