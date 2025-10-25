const { AttachmentBuilder } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getMemberStats, getXpLb } = require("@schemas/MemberStats");
const Canvas = require("@helpr/modern-rank-card");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "rank",
  description: "Displays a member's rank in this server",
  cooldown: 5,
  category: "STATS",
  botPermissions: ["AttachFiles"],

  command: {
    enabled: true,
    usage: "[@member|id]",
  },

  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "Target user",
        type: 6, // USER
        required: false,
      },
    ],
  },

  async messageRun(message, args, data) {
    const member = (await message.guild.resolveMember(args[0])) || message.member;
    const processing = await message.safeReply("🎨 Generating rank card... please wait.");
    
    const response = await getRankCard(member, data.settings);
    await processing.edit(response);
  },

  async interactionRun(interaction, data) {
    const user = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild.members.fetch(user);

    const processing = await interaction.followUp("🎨 Generating rank card... please wait.");
    const response = await getRankCard(member, data.settings);
    await interaction.editReply(response);
  },
};

async function getRankCard(member, settings) {
  const { guild, user } = member;
  if (!settings.stats.enabled) return { content: "Stats tracking is disabled on this server." };

  const memberStats = await getMemberStats(guild.id, user.id);
  if (!memberStats.xp) return { content: `${user.username} is not ranked yet!` };

  const lb = await getXpLb(guild.id, 100);
  const pos = lb.findIndex((doc) => doc.member_id === user.id) + 1 || 0;

  const xpNeeded = memberStats.level * memberStats.level * 100;
  const xpCurrent = memberStats.xp;
  const level = memberStats.level;

  try {
    const rankCard = new Canvas.RankCard()
      .setAddon("rank", true)
      .setAddon("color", true)
      .setAvatar(user.displayAvatarURL({ extension: "png", size: 256 }))
      .setUsername(member.displayName)
      .setLevel(level)
      .setRank(pos)
      .setXP("current", xpCurrent)
      .setXP("needed", xpNeeded)
      .setColor("bar", { gradient: { colors: ["#00C9FF", "#92FE9D"], angle: 90 } })
      .setColor("level", "#FFD700")
      .setColor("rank", "#B993D6")
      .setBackground("https://i.ibb.co/dsjZY6Q9/images-6.jpg")
      .setColor("overlay", "rgba(0,0,0,0.35)")
      .setColor("avatar", EMBED_COLORS.BOT_EMBED);

    const image = await rankCard.toAttachment();
    const attachment = new AttachmentBuilder(image.toBuffer(), { name: "rank.png" });
    return { content: "", files: [attachment] };
  } catch (err) {
    console.error("Rank card generation failed:", err);
    return { content: "Failed to generate rank card." };
  }
}
