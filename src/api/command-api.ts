import { type ApplicationCommand, type SlashCommandBuilder } from "discord.js";

import { APP_ID, DISCORD_API, GUILD_ID } from "../constants/env-constants.js";
import { discordRequest } from "./fetch.js";

const GUILD_ENDPOINT = `/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

export async function getGuildSlashCommands(): Promise<ApplicationCommand[]> {
  return discordRequest(`${DISCORD_API}${GUILD_ENDPOINT}`, {
    method: "GET",
  });
}

export async function postGuildSlashCommand(command: SlashCommandBuilder) {
  return discordRequest(`${DISCORD_API}${GUILD_ENDPOINT}`, {
    method: "POST",
    body: command as unknown as BodyInit,
  });
}

export async function deleteGuildSlashCommands() {
  const slashCommands = await getGuildSlashCommands();

  if (!slashCommands) {
    return;
  }

  await Promise.all(
    slashCommands.map(async (command) => {
      console.log(`Deleting command "${command.name}" <${command.id}>`);
      await discordRequest(`${DISCORD_API}${GUILD_ENDPOINT}/${command.id}`, {
        method: "DELETE",
      });
    }),
  );
}

export async function deleteGuildSlashCommandById(id: string) {
  const slashCommands = await getGuildSlashCommands();
  if (slashCommands) {
    const commandFound = slashCommands.filter((command) => command.id === id);
    if (commandFound.length > 0) {
      console.info(`Deleting command "${commandFound[0].name}" <${commandFound[0].id}>`);
      return await discordRequest(`${DISCORD_API}${GUILD_ENDPOINT}/${id}`, {
        method: "DELETE",
      });
    } else {
      console.error(`Command id <${id}> not found.`);
    }
  }
}
