import fs from "node:fs";
import path from "node:path";
import { Collection } from "discord.js";
import { COMMANDS_FOLDER } from "../../constants/app-constants.js";
import { getGuildSlashCommands, postGuildSlashCommand } from "../../api/command-api.js";
import { squareIt } from "../../utils/console.js";
import { COMMAND_OVERRIDE } from "../../constants/env-constants.js";
import { type Command } from "../../types/Command.js";

export async function loadLocalSlashCommands(): Promise<Collection<string, Command>> {
	const commands = new Collection<string, Command>();
	const commandsPath = path.join(process.cwd(), COMMANDS_FOLDER);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));

	for (const file of commandFiles) {
		const command: Command = (await import(`../${file}`)).default;
		commands.set(command.data.name, command);
	}

	return commands;
}

export async function syncSlashCommands(localCommands: Collection<string, Command>): Promise<void> {
	const commandsArray = Array.from(localCommands.values());
	try {
		const serverSlashCommands = await getGuildSlashCommands();
		const serverSlashCommandNames = serverSlashCommands.map((command) => command.name);
		if (serverSlashCommands) {
			const messages = await Promise.all(
				commandsArray.map(async (command) => {
					return await syncSlashCommand(command, serverSlashCommandNames);
				}),
			);
			squareIt(messages);
		}
	} catch (e) {
		console.error(e);
	}
}

async function syncSlashCommand(localCommand: Command, serverCommandNames: string[]) {
	if (!serverCommandNames.includes(localCommand.data.name)) {
		await postGuildSlashCommand(localCommand.data);
		return `Installing command <${localCommand.data.name}>`;
	} else {
		if (COMMAND_OVERRIDE) await postGuildSlashCommand(localCommand.data);
		return `Command <${localCommand.data.name}> is ${COMMAND_OVERRIDE ? "updated" : "already installed"}`;
	}
}
