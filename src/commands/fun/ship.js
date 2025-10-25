const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const Canvas = require("canvas");

// Replace these with your actual role IDs
const MALE_ROLE_ID = "1430591296808030229";
const FEMALE_ROLE_ID = "1430606157860438016";

const QUOTES = [
  "A love written in the stars ✨",
  "Maybe it’s meant to be ❤️",
  "There’s potential here 👀",
  "It’s complicated... 💔",
  "Love is in the air 💞",
  "A perfect match made by destiny 💖",
];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "ship",
  description: "Check love compatibility between two users",
  category: "FUN",
  cooldown: 10,
  botPermissions: ["SendMessages", "EmbedLinks", "AttachFiles"],

  command: {
    enabled: true,
    usage: "ship [@user]",
  },

  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "Mention a user to check compatibility with",
        type: 6, // USER
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    const processing = await message.safeReply("💖 Processing your ship...");
    const mention = message.mentions.users.first();
    const result = await handleShip(message, message.author, mention);
    await processing.edit(result);
  },

  async interactionRun(interaction) {
    await interaction.followUp("💖 Processing your ship...");
    const target = interaction.options.getUser("user");
    const result = await handleShip(interaction, interaction.user, target);
    await interaction.editReply(result);
  },
};

async function handleShip(ctx, user1, user2) {
  const guild = ctx.guild;
  let partner = user2;

  if (!partner) {
    const member = guild.members.cache.get(user1.id);
    const isMale = member.roles.cache.has(MALE_ROLE_ID);
    const isFemale = member.roles.cache.has(FEMALE_ROLE_ID);

    if (!isMale && !isFemale)
      return { content: "❌ You don't have a valid gender role." };

    const targetRoleId = isMale ? FEMALE_ROLE_ID : MALE_ROLE_ID;
    const targetRole = guild.roles.cache.get(targetRoleId);

    if (!targetRole || targetRole.members.size === 0)
      return { content: "⚠️ No members found with the opposite role." };

    const members = Array.from(targetRole.members.values());
    const randomMember = members[Math.floor(Math.random() * members.length)];
    partner = randomMember.user;
  }

  if (partner.id === user1.id)
    return { content: "💀 You can’t ship yourself... that’s just self-love!" };

  const percentage = Math.floor(Math.random() * 101);
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const image = await createShipImage(user1, partner, percentage);
  const attachment = new AttachmentBuilder(image, { name: "ship.png" });
  const member1 = ctx.guild.members.cache.get(user1.id);
  const member2 = ctx.guild.members.cache.get(partner.id);

  const name1 = member1?.displayName || user1.username;
  const name2 = member2?.displayName || partner.username;

  const embed = new EmbedBuilder()
    .setTitle(`**${name1}** ❤️ **${name2}**`)
    .setDescription(
      `💘 **Compatibility:** ${percentage}%\n💬 *${quote}*`
    )
    .setColor(percentage >= 70 ? 0xff4d88 : 0x7289da)
    .setImage("attachment://ship.png");

  return { content: "", embeds: [embed], files: [attachment] };
}

async function createShipImage(user1, user2, lovePercentage) {
  const canvas = Canvas.createCanvas(700, 250);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 700, 0);
  if (lovePercentage >= 70) {
    gradient.addColorStop(0, "#ff4d6d");
    gradient.addColorStop(1, "#ff758f");
  } else if (lovePercentage >= 40) {
    gradient.addColorStop(0, "#ffa07a");
    gradient.addColorStop(1, "#ffb6c1");
  } else {
    gradient.addColorStop(0, "#9ea7ad");
    gradient.addColorStop(1, "#c0c0c0");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const avatar1 = await Canvas.loadImage(user1.displayAvatarURL({ extension: "png", size: 256 }));
  const avatar2 = await Canvas.loadImage(user2.displayAvatarURL({ extension: "png", size: 256 }));

  ctx.save();
  ctx.beginPath();
  ctx.arc(125, 125, 80, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar1, 45, 45, 160, 160);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(575, 125, 80, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar2, 495, 45, 160, 160);
  ctx.restore();

  ctx.font = "bold 40px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(`❤️ ${lovePercentage}% ❤️`, canvas.width / 2, 135);

  return canvas.toBuffer();
}
