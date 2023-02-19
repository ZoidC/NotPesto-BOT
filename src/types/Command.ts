import { CommandInteraction, ChatInputApplicationCommandData, SlashCommandBuilder } from "discord.js";

export interface Command extends ChatInputApplicationCommandData {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}
