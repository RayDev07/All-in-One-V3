const { ApplicationCommandOptionType, PermissionsBitField } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "say",
  description: "Send a message through the bot",
  category: "ADMIN",
  userPermissions: ["ManageGuild"], // only admins can use
  botPermissions: ["SendMessages", "EmbedLinks", "ManageMessages"],

  command: {
    enabled: true,
    usage: "<message>",
    minArgsCount: 1,
  },

  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: "message",
        description: "The message you want the bot to say",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.safeReply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
    }

    const text = args.join(" ");
    if (!text) return message.safeReply({ content: "❌ Please provide a message to send.", ephemeral: true });

    // Delete the user message
    if (message.deletable) await message.delete();

    // Send the bot message
    const sentMessage = await message.channel.send(text);

    // Ephemeral confirmation
    await message.safeReply({ content: `✅ Message sent successfully! [Jump to message](${sentMessage.url})`, ephemeral: true });
  },

  async interactionRun(interaction) {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.editReply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
    }

    const text = interaction.options.getString("message");
    if (!text) return interaction.editReply({ content: "❌ Please provide a message to send.", ephemeral: true });

    // Send the bot message
    const sentMessage = await interaction.channel.send(text);

    // Ephemeral confirmation
    await interaction.editReply({ content: `✅ Message sent successfully! [Jump to message](${sentMessage.url})`, ephemeral: true });
  },
};
