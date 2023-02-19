import { ApplicationAssetFormat, ApplicationCommand, SlashCommandBuilder } from "discord.js";
import { APP_ID, DISCORD_API, GUILD_ID } from "../constants/env-constants.js";
import { Command } from "../types/Command.js";
import { DiscordRequest } from "./fetch.js";

const GUILD_ENDPOINT = `/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

export async function getGuildSlashCommands(): Promise<ApplicationCommand[]> {
  return await DiscordRequest(`${DISCORD_API}${GUILD_ENDPOINT}`, {
    method: "GET",
  });
}

export async function postGuildSlashCommand(command: SlashCommandBuilder) {
  return await DiscordRequest(`${DISCORD_API}${GUILD_ENDPOINT}`, {
    method: "POST",
    body: command,
  });
}

export async function deleteGuildSlashCommands() {
  const slashCommands = await getGuildSlashCommands();

  if (!slashCommands) return;

  await Promise.all(
    slashCommands.map(async (command) => {
      console.log(`Deleting command "${command.name}" <${command.id}>`);
      await DiscordRequest(`${DISCORD_API}${GUILD_ENDPOINT}/${command.id}`, {
        method: "DELETE",
      });
    })
  );
}

export async function deleteGuildSlashCommandById(id: string) {
  const slashCommands = await getGuildSlashCommands();
  if (slashCommands) {
    const commandFound = slashCommands.filter((command) => command.id === id);
    if (commandFound.length > 0) {
      console.info(`Deleting command "${commandFound[0].name}" <${commandFound[0].id}>`);
      return await DiscordRequest(`${DISCORD_API}${GUILD_ENDPOINT}/${id}`, {
        method: "DELETE",
      });
    } else {
      console.error(`Command id <${id}> not found.`);
    }
  }
}
