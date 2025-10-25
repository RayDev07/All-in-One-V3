const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { createTempVoice, deleteTempVoice, getAll } = require("../../src/database/schemas/tempvoice"); // path adjusted
const MASTER_CATEGORY_ID = "1430673210654855370";

const MASTER_VOICE_IDS = {
  solo: "1426787282836521123",
  duo: "1426787378562994287",
  trio: "1426787536776204440",
  squad: "1426788200365424692",
  tenz: "1426788667321749586",
};

const LIMITS = { solo: 1, duo: 2, trio: 3, squad: 4, tenz: 10 };

async function initTempVoiceSystem(client) {
  // Cleanup on startup
  const saved = await getAll();
  for (const record of saved) {
    const guild = client.guilds.cache.get(record.guildId);
    if (!guild) continue;

    const channel = guild.channels.cache.get(record.channelId);
    if (!channel) {
      await deleteTempVoice(record.channelId, client);
      continue;
    }

    if (channel.members.size === 0) {
      await deleteTempVoice(record.channelId, client);
    }
  }

  // Listen to voice state updates
  client.on("voiceStateUpdate", async (oldState, newState) => {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;
    if (newState.member?.user.bot) return;

    const joinedId = newState.channelId;
    const leftId = oldState.channelId;

    const getMasterType = (id) => Object.keys(MASTER_VOICE_IDS).find(t => MASTER_VOICE_IDS[t] === id);

    // User joined a master VC
    const joinedType = getMasterType(joinedId);
    if (joinedType) {
      const tempName = `🔸${joinedType.toUpperCase()}`;

      try {
        const tempVc = await guild.channels.create({
          name: tempName,
          type: ChannelType.GuildVoice,
          parent: MASTER_CATEGORY_ID,
          userLimit: LIMITS[joinedType],
          permissionOverwrites: [
            { id: guild.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel] },
            { id: newState.member.id, allow: [PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ManageChannels] },
          ],
        });

        await createTempVoice({
          guildId: guild.id,
          channelId: tempVc.id,
          ownerId: newState.member.id,
          type: joinedType,
        });

        await newState.setChannel(tempVc).catch(() => {});
        console.log(`✅ Temp VC created: ${tempVc.name} for ${newState.member.user.tag}`);
      } catch (err) {
        console.error("❌ Failed to create temp VC:", err);
      }
    }

    // User left a temp VC
    if (leftId && leftId !== joinedId) {
      const oldChannel = oldState.channel;
      if (!oldChannel) return;

      const savedVCs = await getAll();
      const record = savedVCs.find(r => r.channelId === oldChannel.id);
      if (!record) return;

      if (oldChannel.members.size === 0) {
        await deleteTempVoice(oldChannel.id, client);
      }
    }
  });

  client.logger?.success("Temp Voice System initialized");
}

module.exports = { initTempVoiceSystem };
