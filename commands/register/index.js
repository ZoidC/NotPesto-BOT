import { Routes } from 'discord.js';
import { DiscordRequest } from "../utils/index.js";

export async function HasGuildCommands(appId, guildId, commands) {
    if (guildId === '' || appId === '') return;

    commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
    const endpoint = Routes.applicationGuildCommands(appId, guildId);

    try {
        const res = await DiscordRequest(endpoint, { method: 'GET' });
        const data = await res.json();

        if (data) {
            const installedNames = data.map((c) => c['name']);
            // This is just matching on the name, so it's not good for updates
            if (!installedNames.includes(command['name'])) {
                console.log(`Installing "${command['name']}"`);
                InstallGuildCommand(appId, guildId, command);
            } else {
                console.log(`"${command['name']}" command already installed`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

// Installs a command
async function InstallGuildCommand(appId, guildId, command) {
    const endpoint = Routes.applicationGuildCommands(appId, guildId);

    try {
        await DiscordRequest(endpoint, { method: 'POST', body: command });
    } catch (err) {
        console.error(err);
    }
}