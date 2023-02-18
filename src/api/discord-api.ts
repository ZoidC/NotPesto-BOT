import { Client, FetchGuildOptions, GuildMember } from "discord.js";
import { DISCORD_API, GUILD_ID } from "../constants/env-constants.js";
import { DiscordRequest } from "./fetch.js";

const USER_ENDPOINT = "users/";
// eslint-disable-next-line no-unused-vars
const GUILD_ENDPOINT = `/guilds/${GUILD_ID}/`;

export async function getUserById(id: string) {
  return await DiscordRequest(`${DISCORD_API}${USER_ENDPOINT}${id}`, {
    method: "GET",
  });
}

// eslint-disable-next-line no-unused-vars
export async function getGuildMemberById(client: Client, id: string): Promise<GuildMember | null> {
  const guild = await client.guilds.fetch({});
  const member = client.guilds.cache.get(`${GUILD_ID}`)?.members.cache.get(id);
  return member ? member : null;
}
