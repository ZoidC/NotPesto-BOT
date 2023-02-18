import { APP_ID, DISCORD_API, DISCORD_TOKEN, GUILD_ID } from '../constants/env-constants.js';

const BASE_URL = DISCORD_API;
const GUILD_ENDPOINT = `/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

export async function getGuildSlashCommands() {
    return await CommandRequest(GUILD_ENDPOINT, { method: 'GET' });
}

export async function postGuildSlashCommand(command) {
    return await CommandRequest(GUILD_ENDPOINT, { method: 'POST', body: command });
}

export async function deleteGuildSlashCommands() {
    const slashCommands = await getGuildSlashCommands();
    if (!slashCommands) return;

    await Promise.all(slashCommands.map(async (command) => {
        console.log(`Deleting command "${command.name}" <${command.id}>`);
        await CommandRequest(`${GUILD_ENDPOINT}/${command.id}`, { method: 'DELETE' });
    }));
}

export async function deleteGuildSlashCommandById(id) {
    const slashCommands = await getGuildSlashCommands();
    if (slashCommands) {
        const commandFound = slashCommands.filter(command => command.id === id);
        if (commandFound.length > 0) {
            console.log(`Deleting command "${commandFound[0].name}" <${commandFound[0].id}>`);
            return await CommandRequest(`${GUILD_ENDPOINT}/${id}`, { method: 'DELETE' });
        } else {
            console.log(`Command id <${id}> not found.`);
        }
    }
}

// Global Request
async function CommandRequest(endpoint, options) {
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