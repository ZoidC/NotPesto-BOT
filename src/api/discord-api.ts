import { Guild, GuildMember } from "discord.js";
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

export async function getGuildMemberById(guild: Guild, id: string): Promise<GuildMember> {
  const member = await guild.members.fetch(id);
  return member;
}
