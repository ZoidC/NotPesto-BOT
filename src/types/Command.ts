import {
  CommandInteraction,
  ChatInputApplicationCommandData,
  Client,
  SlashCommandBuilder,
} from "discord.js";

export interface Command extends ChatInputApplicationCommandData {
  id: any;
  data: SlashCommandBuilder;
  execute: (client: Client, interaction: CommandInteraction) => void;
}
