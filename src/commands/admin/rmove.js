const { ApplicationCommandOptionType, PermissionsBitField } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "rmove",
  description: "Move all members of a specific role (who are in voice channels) to a target channel",
  category: "ADMIN",
  userPermissions: ["MoveMembers"],
  botPermissions: ["MoveMembers"],

  command: {
    enabled: true,
    usage: "<role> <target-channel>",
    minArgsCount: 2,
  },

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "role",
        description: "The role whose members you want to move",
        type: ApplicationCommandOptionType.Role,
        required: true,
      },
      {
        name: "target",
        description: "The target voice channel",
        type: ApplicationCommandOptionType.Channel,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    const targetChannel = message.mentions.channels.last() || message.guild.channels.cache.get(args[1]);

    if (!role) return message.safeReply("❌ Please mention or provide a valid role.");
    if (!targetChannel || targetChannel.type !== 2) return message.safeReply("❌ Please mention or provide a valid target voice channel.");

    const members = role.members.filter(m => m.voice.channel);
    if (members.size === 0) return message.safeReply("⚠️ No members with that role are in a voice channel.");

    for (const [, m] of members) {
      await m.voice.setChannel(targetChannel).catch(() => null);
    }

    await message.safeReply(`✅ Moved ${members.size} members with role **${role.name}** to **${targetChannel.name}**.`);
  },

  async interactionRun(interaction) {
    const role = interaction.options.getRole("role");
    const targetChannel = interaction.options.getChannel("target");

    const members = role.members.filter(m => m.voice.channel);
    if (members.size === 0) return interaction.editReply("⚠️ No members with that role are in a voice channel.");

    for (const [, m] of members) {
      await m.voice.setChannel(targetChannel).catch(() => null);
    }

    await interaction.editReply(`✅ Moved ${members.size} members with role **${role.name}** to **${targetChannel.name}**.`);
  },
};
