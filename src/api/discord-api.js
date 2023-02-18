import { DISCORD_API, GUILD_ID } from '../constants/env-constants.js';
import { DiscordRequest } from './fetch.js';

const USER_ENDPOINT = "users/";
// eslint-disable-next-line no-unused-vars
const GUILD_ENDPOINT = `/guilds/${GUILD_ID}/`;

export async function getUserById(id) {
    return await DiscordRequest(`${DISCORD_API}${USER_ENDPOINT}${id}`, { method: 'GET' });
}

// eslint-disable-next-line no-unused-vars
export async function getGuildUserById(client, id) {
    // return await DiscordRequest(`${DISCORD_API}${GUILD_ENDPOINT}members/${id}`, { method: 'GET' });
    // Temporary to not hit the rate limit
    const guild = await client.guilds.fetch([])
    await guild.members.fetch(id)
    return guild.members.get(id)

}