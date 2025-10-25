const { ApplicationCommandOptionType, PermissionsBitField } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "tmove",
  description: "Move all members from your current voice channel to another channel",
  category: "ADMIN",
  userPermissions: ["MoveMembers"],
  botPermissions: ["MoveMembers"],

  command: {
    enabled: true,
    usage: "<target-channel>",
    minArgsCount: 1,
  },

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "target",
        description: "The target voice channel to move members to",
        type: ApplicationCommandOptionType.Channel,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const member = message.member;
    const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!member.voice.channel) return message.safeReply("❌ You must be in a voice channel to use this command.");
    if (!targetChannel || targetChannel.type !== 2) return message.safeReply("❌ Please mention or provide a valid voice channel.");

    const sourceChannel = member.voice.channel;
    const members = Array.from(sourceChannel.members.values());
    if (members.length === 0) return message.safeReply("⚠️ No members to move.");

    for (const m of members) {
      await m.voice.setChannel(targetChannel).catch(() => null);
    }

    await message.safeReply(`✅ Moved ${members.length} members from **${sourceChannel.name}** to **${targetChannel.name}**.`);
  },

  async interactionRun(interaction) {
    const member = interaction.member;
    const targetChannel = interaction.options.getChannel("target");

    if (!member.voice.channel) return interaction.editReply("❌ You must be in a voice channel to use this command.");

    const sourceChannel = member.voice.channel;
    const members = Array.from(sourceChannel.members.values());
    if (members.length === 0) return interaction.editReply("⚠️ No members to move.");

    for (const m of members) {
      await m.voice.setChannel(targetChannel).catch(() => null);
    }

    await interaction.editReply(`✅ Moved ${members.length} members from **${sourceChannel.name}** to **${targetChannel.name}**.`);
  },
};
