import { DISCORD_API, DISCORD_TOKEN, GUILD_ID } from '../constants/env-constants.js';

const BASE_URL = DISCORD_API;
const USER_ENDPOINT = "users/";
const GUILD_ENDPOINT = `/guilds/${GUILD_ID}/`;

export async function getUserById(id) {
    return await DiscordRequest(USER_ENDPOINT + id, { method: 'GET' });
}

export async function getGuildUserById(id) {
    return await DiscordRequest(GUILD_ENDPOINT + "members/" + id, { method: 'GET' });
}

// Global Request
async function DiscordRequest(endpoint, options) {
    const url = BASE_URL + endpoint;
    if (options.body) options.body = JSON.stringify(options.body);

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${DISCORD_TOKEN}`,
            'Content-Type': 'application/json; charset=UTF-8',
        },
        ...options
    });

    const jsonRes = res.status != 204 ? await res.json() : null;

    if (!res.ok) {
        console.log(res.status);
        throw new Error(JSON.stringify(jsonRes));
    }

    return jsonRes;
}