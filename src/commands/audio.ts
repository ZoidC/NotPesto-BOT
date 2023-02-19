import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  generateDependencyReport,
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import { ChatInputCommandInteraction, Client, Interaction, SlashCommandBuilder } from "discord.js";
import path, { join } from "node:path";
import { GUILD_ID } from "../constants/env-constants";
const audioFiles = new Map<string, string>([["taunt", "taunt.wav"]]);
const Audio = {
  data: new SlashCommandBuilder()
    .setName("audio")
    .setDescription("Play some audio!")
    .addSubcommand((sc) =>
      sc
        .setName("play")
        .setDescription("play something")
        .addStringOption((option) =>
          option
            .setName("sound")
            .setDescription("Which sound to play")
            .setRequired(true)
            .addChoices({ name: "Taunt", value: "taunt" })
        )
    )
    .addSubcommand((sc) => sc.setName("stop").setDescription("Stop the audio and disconnect")),

  async execute(client: Client, interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return await interaction.reply("This must be used in a guild");

    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "play": {
        await interaction.deferReply();

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return await interaction.reply("You have to join a voice channel first.");
        if (!voiceChannel?.viewable) return await interaction.reply("I need **`VIEW_CHANNEL`** permission.");
        if (!voiceChannel?.joinable) return await interaction.reply("I need **`CONNECT_CHANNEL`** permission.");

        const audioOption = interaction.options.getString("sound", true);
        const audioFileName = audioFiles.get(audioOption)!;

        const conn = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: voiceChannel.guild.id,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        const player = createAudioPlayer();
        const filePath = join(path.resolve(), "audio", audioFileName);
        const resource = createAudioResource(filePath);
        console.log("loading: ", filePath);
        console.log("loading: ", resource);

        if (!(conn.state.status === "signalling")) {
          try {
            console.log("Waiting for enter state");
            await entersState(conn, VoiceConnectionStatus.Ready, 15000);
            console.log("Connected: " + voiceChannel.guild.name);
          } catch (error) {
            console.log("Voice Connection not ready within 5s.", error);
            return null;
          }
        }

        conn.subscribe(player);

        player.play(resource);

        player.on("error", (error) => {
          console.error(error);
        });
        await entersState(player, AudioPlayerStatus.Playing, 5_000);
        // The player has entered the Playing state within 5 seconds
        console.log("Playback has started!");
        await interaction.followUp("Playing...");
        return player.addListener(AudioPlayerStatus.Idle, () => {
          conn.disconnect();
        });
      }
    }
  },
};

export default Audio;
