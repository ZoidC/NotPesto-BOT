import { Routes } from 'discord.js';
import { DiscordRequest } from "../utils/index.js";

export async function DeleteCommand(appId, guildId, commandId) {
    if (guildId === '' || appId === '') return;

    const endpoint = Routes.applicationGuildCommands(appId, guildId);

    try {
        const res = await DiscordRequest(endpoint, { method: 'GET' });
        const data = await res.json();

        if (data) {
            const commandFound = data.filter((c) => c['id'] === commandId);
            if (commandFound.length > 0) {
                console.log(`Deleting command "${commandFound[0].name}" <${commandFound[0].id}>`);
                DeleteGuildCommand(appId, guildId, commandFound[0].id);
            } else {
                console.log(`Command id <${commandId}> not found.`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

// Delete a command
async function DeleteGuildCommand(appId, guildId, commandId) {
    const endpoint = Routes.applicationGuildCommand(appId, guildId, commandId);

    try {
        await DiscordRequest(endpoint, { method: 'DELETE' });
    } catch (err) {
        console.error(err);
    }
}