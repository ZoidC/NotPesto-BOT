import { DISCORD_API, GUILD_ID } from '../constants/env-constants.js';
import { DiscordRequest } from './fetch.js';

const USER_ENDPOINT = "users/";
// eslint-disable-next-line no-unused-vars
const GUILD_ENDPOINT = `/guilds/${GUILD_ID}/`;

export async function getUserById(id) {
    return await DiscordRequest(`${DISCORD_API}${USER_ENDPOINT}${id}`, { method: 'GET' });
}

// eslint-disable-next-line no-unused-vars
export async function getGuildUserById(id) {
    // return await DiscordRequest(`${DISCORD_API}${GUILD_ENDPOINT}members/${id}`, { method: 'GET' });
    // Temporary to not hit the rate limit
    return await (new Promise((resolve) => {
        resolve({
            "avatar": null,
            "communication_disabled_until": null,
            "flags": 0,
            "is_pending": false,
            "joined_at": "2021-01-08T20:03:25.054000+00:00",
            "nick": "CGN | Gucci_Sliders",
            "pending": false,
            "premium_since": null,
            "roles": [
                "544887722670555148"
            ],
            "user": {
                "id": "114458356491485185",
                "username": "Gucci",
                "display_name": null,
                "avatar": "36a9b485e527691c8e55926d7e9f4e63",
                "avatar_decoration": null,
                "discriminator": "4945",
                "public_flags": 0
            },
            "mute": false,
            "deaf": false
        });
    }));
}