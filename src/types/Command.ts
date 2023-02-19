import { type CommandInteraction, type ChatInputApplicationCommandData, type SlashCommandBuilder } from "discord.js";

export interface Command extends ChatInputApplicationCommandData {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}
