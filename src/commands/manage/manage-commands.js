import fs from 'node:fs';
import path from 'node:path';
import { Collection } from 'discord.js';
import { COMMANDS_FOLDER } from "../../constants/app-constants.js";
import { getGuildSlashCommands, postGuildSlashCommand } from '../../api/discord-api.js';
import { squareIt } from '../../utils/console.js';

export async function loadLocalCommands() {
    const commands = new Collection();
    const commandsPath = path.join(process.cwd(), COMMANDS_FOLDER);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = (await import(`../${file}`)).default;

        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    return commands;
}

export async function compareLocalAndServerCommands(localCommands) {
    try {
        const serverCommands = await getGuildSlashCommands();
        const installedCommandNames = serverCommands.map((command) => command['name']);
        if (serverCommands) {
            const messages = await Promise.all(localCommands.map(async (command) => {
                return await compareLocalAndServerCommand(command, installedCommandNames);
            }));
            squareIt(messages);
        }
    } catch (err) {
        console.error(err);
    }
}

async function compareLocalAndServerCommand(localCommand, serverCommandNames) {
    if (!serverCommandNames.includes(localCommand['name'])) {
        await postGuildSlashCommand(localCommand);
        return `Installing command <${localCommand['name']}>`;
    } else {
        return `Command <${localCommand['name']}> is already installed.`;
    }
}