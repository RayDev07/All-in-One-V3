const { PermissionsBitField } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "fkick",
  description: "Disconnect all members in your current voice channel",
  category: "ADMIN",
  userPermissions: ["MoveMembers"],
  botPermissions: ["MoveMembers"],

  command: {
    enabled: true,
  },

  slashCommand: {
    enabled: true,
    ephemeral: true,
  },

  async messageRun(message) {
    const member = message.member;
    if (!member.voice.channel) return message.safeReply("❌ You must be in a voice channel to use this command.");

    const channel = member.voice.channel;
    const members = Array.from(channel.members.values());
    if (members.length === 0) return message.safeReply("⚠️ No members to disconnect.");

    for (const m of members) {
      await m.voice.disconnect().catch(() => null);
    }

    await message.safeReply(`✅ Disconnected ${members.length} members from **${channel.name}**.`);
  },

  async interactionRun(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) return interaction.editReply("❌ You must be in a voice channel to use this command.");

    const channel = member.voice.channel;
    const members = Array.from(channel.members.values());
    if (members.length === 0) return interaction.editReply("⚠️ No members to disconnect.");

    for (const m of members) {
      await m.voice.disconnect().catch(() => null);
    }

    await interaction.editReply(`✅ Disconnected ${members.length} members from **${channel.name}**.`);
  },
};
