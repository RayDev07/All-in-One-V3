const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fetch = require("node-fetch");

// Map for per-user cooldown
const cooldowns = new Map();

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "tod",
  description: "Play Truth or Dare with random questions",
  cooldown: 10,
  category: "FUN",
  botPermissions: ["SendMessages", "EmbedLinks", "UseExternalEmojis"],
  command: { enabled: true },
  slashCommand: { enabled: true },

  async messageRun(message) {
    await startTruthOrDare(message);
  },

  async interactionRun(interaction) {
    await startTruthOrDare(interaction);
  },
};

async function startTruthOrDare(target) {
  // Initial embed
  const embed = new EmbedBuilder()
    .setTitle("🎲 Truth or Dare")
    .setDescription("Click a button below to get a random question")
    .setColor("Random")
    .setTimestamp();

  await sendQuestionEmbed(target, embed);
}

async function sendQuestionEmbed(target, embed) {
  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("truth").setLabel("Truth").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("dare").setLabel("Dare").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("random").setLabel("Random").setStyle(ButtonStyle.Success)
  );

  // Send new embed with buttons
  const msg = await (target.followUp
    ? target.followUp({ embeds: [embed], components: [buttonRow] })
    : target.channel.send({ embeds: [embed], components: [buttonRow] }));

  // Collector for this specific embed
  const collector = msg.createMessageComponentCollector({ componentType: 2 });

  collector.on("collect", async (btn) => {
    const userId = btn.user.id;

    // 5-second per-user cooldown
    if (cooldowns.has(userId)) {
      return btn.reply({ content: "⏱️ Please wait 5 seconds before clicking again.", ephemeral: true });
    }
    cooldowns.set(userId, true);
    setTimeout(() => cooldowns.delete(userId), 5000);

    if (!["truth", "dare", "random"].includes(btn.customId)) return;
    await btn.deferUpdate();

    // Random rating
    const ratings = ["pg", "pg13"];
    const rating = ratings[Math.floor(Math.random() * ratings.length)];

    // Determine URL
    let url = "";
    if (btn.customId === "truth") url = `https://api.truthordarebot.xyz/v1/truth?rating=${rating}`;
    else if (btn.customId === "dare") url = `https://api.truthordarebot.xyz/api/dare?rating=${rating}`;
    else url = Math.random() < 0.5
      ? `https://api.truthordarebot.xyz/v1/truth?rating=${rating}`
      : `https://api.truthordarebot.xyz/api/dare?rating=${rating}`;

    const res = await fetch(url);
    const data = await res.json();

    // Embed showing who pressed the button
    const questionEmbed = new EmbedBuilder()
      .setTitle(`🎲 ${data.type} | Rating: ${rating.toUpperCase()}`)
      .setDescription(data.question)
      .setColor("Random")
      .setTimestamp()
      .setAuthor({ name: btn.user.username, iconURL: btn.user.displayAvatarURL({ dynamic: true }) });

    // Send a new embed with buttons and attach a collector for it
    await sendQuestionEmbed(btn, questionEmbed);
  });
}
