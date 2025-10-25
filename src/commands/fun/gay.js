const { EmbedBuilder } = require("discord.js");
const Canvas = require("canvas");

const OWNER_ID = "905880683006799882";

module.exports = {
  name: "gay",
  description: "Check gay percentage of a user",
  cooldown: 10,
  category: "FUN",
  botPermissions: ["SendMessages", "EmbedLinks", "AttachFiles"],
  command: { enabled: true },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "Select a user to check",
        type: 6,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const user = message.mentions.users.first() || message.author;

    // 1. Send processing message as a reply to the user's message
    const processing = await message.reply({
      content: "🏳️‍🌈 Calculating gay percentage... please wait.",
      allowedMentions: { repliedUser: false },
    });

    // 2. Generate final result
    const result = await generateGayResult(user);

    // 3. Delete the processing message
    await processing.delete().catch(() => null);

    // 4. Send the final embed as a reply to the user's message
    await message.reply({ ...result, allowedMentions: { repliedUser: false } });
  },

  async interactionRun(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;

    // 1. Defer reply to prevent timeout
    await interaction.deferReply();

    // 2. Generate final result
    const result = await generateGayResult(user);

    // 3. Edit deferred reply with final result
    await interaction.editReply(result);
  },
};

function getQuote(percentage) {
  if (percentage <= 20) return "😇 • **Not quite flying the rainbow flag yet.**";
  if (percentage <= 40) return "🌈 • **A bit colorful, testing the waters.**";
  if (percentage <= 60) return "🏳️‍🌈 • **Halfway there, love yourself!**";
  if (percentage <= 80) return "🌟 • **Rainbow vibes are strong!**";
  return "🌈 • **Full rainbow energy!**";
}

async function generateGayResult(user) {
  const isOwner = user.id === OWNER_ID;
  const percentage = isOwner ? 0 : Math.floor(Math.random() * 101);

  const canvas = Canvas.createCanvas(700, 250);
  const ctx = canvas.getContext("2d");

  const background = await Canvas.loadImage(
    "https://i.ibb.co/H8S5CgW/240-F-337329594-cs-Erl-Hg-S2h0psecwnx-V5t-MTPIp-WCea-D7.jpg"
  );
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  const avatar = await Canvas.loadImage(
    user.displayAvatarURL({ extension: "png", size: 512 })
  );
  const avatarSize = 180;
  const avatarX = 50;
  const avatarY = canvas.height / 2 - avatarSize / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Sans";
  ctx.fillText(user.displayName, 270, 110);

  ctx.font = "bold 60px Sans";
  ctx.fillText(`${percentage}%`, 270, 160);

  const barX = 270, barY = 180, barWidth = 350, barHeight = 25;
  ctx.fillStyle = "#555555";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const fillWidth = (barWidth * percentage) / 100;
  const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
  gradient.addColorStop(0, "#ff0000");
  gradient.addColorStop(0.25, "#ff7f00");
  gradient.addColorStop(0.5, "#ffff00");
  gradient.addColorStop(0.75, "#00ff00");
  gradient.addColorStop(1, "#0000ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  const buffer = canvas.toBuffer();

  const embed = new EmbedBuilder()
    .setTitle(`${user.username} is ${percentage}% gay.`)
    .setDescription(getQuote(percentage))
    .setColor("Random")
    .setImage("attachment://gay.png");

  return { embeds: [embed], files: [{ attachment: buffer, name: "gay.png" }] };
}
