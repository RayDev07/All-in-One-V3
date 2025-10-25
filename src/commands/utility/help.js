const { CommandCategory, BotClient } = require("@src/structures");
const { EMBED_COLORS, CLIENT_ID, VOTE } = require("@root/config.js");
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Message,
  ButtonBuilder,
  CommandInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
} = require("discord.js");
const { getCommandUsage, getSlashUsage } = require("@handlers/command");

const CMDS_PER_PAGE = 15;
const IDLE_TIMEOUT = 30;

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "help",
  description: "command help menu",
  category: "UTILITY",
  botPermissions: ["EmbedLinks"],
  command: {
    enabled: true,
    usage: "[command]",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "command",
        description: "name of the command",
        required: false,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },

  async messageRun(message, args, data) {
    let trigger = args[0];

    // !help
    if (!trigger) {
      const response = await getHelpMenu(message);
      const sentMsg = await message.safeReply(response);
      return waiter(sentMsg, message.author.id, data.prefix);
    }

    // check if command help (!help cat)
    const cmd = message.client.getCommand(trigger);
    if (cmd) {
      const embed = getCommandUsage(cmd, data.prefix, trigger);
      return message.safeReply({ embeds: [embed] });
    }

    // No matching command/category found
    await message.safeReply("No matching command found");
  },

  async interactionRun(interaction) {
    let cmdName = interaction.options.getString("command");

    // !help
    if (!cmdName) {
      const response = await getHelpMenu(interaction);
      const sentMsg = await interaction.followUp(response);
      return waiter(sentMsg, interaction.user.id);
    }

    // check if command help (!help cat)
    const cmd = interaction.client.slashCommands.get(cmdName);
    if (cmd) {
      const embed = getSlashUsage(cmd);
      return interaction.followUp({ embeds: [embed] });
    }

    // No matching command/category found
    await interaction.followUp("No matching command found");
  },
};

/**
 * @param {CommandInteraction} interaction
 */
async function getHelpMenu({ client, guild }) {
  // Menu Row
  const options = [];
  for (const [k, v] of Object.entries(CommandCategory)) {
    if (v.enabled === false) continue;
    options.push({
      label: v.name,
      value: k,
      description: `View commands in ${v.name} category`,
      emoji: v.emoji,
    });
  }

  const menuRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help-menu")
      .setPlaceholder("Choose the command category")
      .addOptions(options)
  );

  // Support, Invite, and Vote Links
  const supportButton = new ButtonBuilder()
    .setLabel("Support Server")
    .setEmoji('1238430085795545139')
    .setStyle(ButtonStyle.Link)
    .setURL("https://dsc.gg/codexdev");

  const inviteButton = new ButtonBuilder()
    .setLabel("Invite Me")
    .setStyle(ButtonStyle.Link)
    .setEmoji('1238429920573784074')
    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot+applications.commands`);

  const voteButton = new ButtonBuilder()
    .setLabel("Vote Me")
    .setStyle(ButtonStyle.Link)
    .setEmoji('1238429509795971116')
    .setURL(VOTE);

  const buttonsRow = new ActionRowBuilder().addComponents([supportButton]);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setImage(`https://share.creavite.co/663f19346f72a4507e459a7b.gif`)
        .addFields([
        {
          name: "__**<a:loading:1430904475027243119> Features [1-9]**__",
          value: `>>> <:Owner:1361776502143844515> Admin 
<:users:1430900410536956035> Anime 
<:automod:1430900348444344493> Automod 
<:Golden_egg:1430900261311742135> Economy 
<:fun:1430900070039158919> Fun 
<:notify:1430899985637048412> Giveaway 
<:link:1430901778706075699> Invite 
<:bot:1430899801746309171> Information`,
          inline: true
        },
        {
          name: "__**<a:loading:1430904475027243119> Features [10-18]**__",
          value: `>>> <:moderation:1430899677112438827> Moderation 
<:music:1430899594568531980> Music 
<:owner:1430900840368963665> Owner 
<:Comandos:1430899515522547713> Social 
<:Stats:1430900793724375141> Statistics 
<:claim:1430899436753780821> Suggestions 
<:transcript:1430899336677556244> Ticket 
<:utility:1430902778850578455> Utility `,
          inline: true
        }
        ])
    .setDescription(`<a:loading:1430904475027243119> **Mutta Puffs is here to help. \n > It is a multipourpose bot.**
<a:loading:1430904475027243119> __**BOT INFO**__
> <a:host:1430908941726122144> Prefix: \`M\`
> <a:host:1430908941726122144> Discord.js Version: \`v14.15.2\`
> <a:host:1430908941726122144> Running on \`${process.versions.node}\`
> <a:host:1430908941726122144> Modified by \`Mavi\``);

  return {
    embeds: [embed],
    components: [menuRow, buttonsRow],
  };
}


/**
 * @param {Message} msg
 * @param {string} userId
 * @param {string} prefix
 */
const waiter = (msg, userId, prefix) => {
  const collector = msg.channel.createMessageComponentCollector({
    filter: (reactor) => reactor.user.id === userId && msg.id === reactor.message.id,
    idle: IDLE_TIMEOUT * 1000,
    dispose: true,
    time: 5 * 60 * 1000,
  });

  let arrEmbeds = [];
  let currentPage = 0;
  let menuRow = msg.components[0];
  let buttonsRow = msg.components[1];

  collector.on("collect", async (response) => {
    if (!["help-menu", "previousBtn", "nextBtn"].includes(response.customId)) return;
    await response.deferUpdate();

    switch (response.customId) {
      case "help-menu": {
        const cat = response.values[0].toUpperCase();
        arrEmbeds = prefix ? getMsgCategoryEmbeds(msg.client, cat, prefix) : getSlashCategoryEmbeds(msg.client, cat);
        currentPage = 0;

        // Buttons Row
        let components = [];
        buttonsRow.components.forEach((button) =>
          components.push(ButtonBuilder.from(button).setDisabled(arrEmbeds.length > 1 ? false : true))
        );

        buttonsRow = new ActionRowBuilder().addComponents(components);
        msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] }));
        break;
      }

      case "previousBtn":
        if (currentPage !== 0) {
          --currentPage;
          msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] }));
        }
        break;

      case "nextBtn":
        if (currentPage < arrEmbeds.length - 1) {
          currentPage++;
          msg.editable && (await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] }));
        }
        break;
    }
  });

  collector.on("end", () => {
    if (!msg.guild || !msg.channel) return;
    return msg.editable && msg.edit({ components: [] });
  });
};

/**
 * Returns an array of message embeds for a particular command category [SLASH COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 */
function getSlashCategoryEmbeds(client, category) {
  let collector = "";

  // For IMAGE Category
  if (category === "IMAGE") {
    client.slashCommands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) => (collector += `\`/${cmd.name}\``));

    const availableFilters = client.slashCommands
      .get("filter")
      .slashCommand.options[0].choices.map((ch) => ch.name)
      .join(", ");

    const availableGens = client.slashCommands
      .get("generator")
      .slashCommand.options[0].choices.map((ch) => ch.name)
      .join(", ");

    collector +=
      "**Available Filters:**\n" + `${availableFilters}` + `*\n\n**Available Generators**\n` + `${availableGens}`;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription(collector);

    return [embed];
  }

  // For REMAINING Categories
  const commands = Array.from(client.slashCommands.filter((cmd) => cmd.category === category).values());

  if (commands.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription("No commands in this category");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);

    toAdd = toAdd.map((cmd) => {
      const subCmds = cmd.slashCommand.options?.filter((opt) => opt.type === "SUB_COMMAND");
      const subCmdsString = subCmds?.map((s) => s.name).join(", ");

      return `<a:arrow:1430906634229780501>\`/${cmd.name}\`\n <a:loading:1430904475027243119> ${cmd.description} \n ${
        !subCmds?.length ? "" : `❯ **SubCommands [${subCmds?.length}]**: ${subCmdsString}\n`
      } `;
    });

    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription(item.join("\n"))
      .setFooter({ text: `page ${index + 1} of ${arrSplitted.length}` });
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}

/**
 * Returns an array of message embeds for a particular command category [MESSAGE COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 * @param {string} prefix
 */
function getMsgCategoryEmbeds(client, category, prefix) {
  let collector = "";

  // For IMAGE Category
  if (category === "IMAGE") {
    client.commands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) =>
        cmd.command.aliases.forEach((alias) => {
          collector += `\`${alias}\`, `;
        })
      );

    collector +=
      "\n\nYou can use these image commands in following formats\n" +
      `**${prefix}cmd:** Picks message authors avatar as image\n` +
      `**${prefix}cmd <@member>:** Picks mentioned members avatar as image\n` +
      `**${prefix}cmd <url>:** Picks image from provided URL\n` +
      `**${prefix}cmd [attachment]:** Picks attachment image`;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription(collector);

    return [embed];
  }

  // For REMAINING Categories
  const commands = client.commands.filter((cmd) => cmd.category === category);

  if (commands.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription("No commands in this category");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);
    toAdd = toAdd.map((cmd) => `<a:arrow:1430906634229780501> \`${prefix}${cmd.name}\`\n <a:loading:1430904475027243119> ${cmd.description} \n`);
    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category]?.image)
      .setAuthor({ name: `${category} Commands` })
      .setDescription(item.join("\n"))
      .setFooter({
        text: `page ${index + 1} of ${arrSplitted.length} | Type ${prefix}help <command> for more command information`,
      });
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}
