import fs from "node:fs";
import path from "node:path";
import { ApplicationCommand, Collection } from "discord.js";
import { COMMANDS_FOLDER } from "../../constants/app-constants.js";
import { getGuildSlashCommands, postGuildSlashCommand } from "../../api/command-api.js";
import { squareIt } from "../../utils/console.js";
import { COMMAND_OVERRIDE } from "../../constants/env-constants.js";
import { Command } from "../../types/Command.js";

export async function loadLocalCommands(): Promise<Collection<string, Command>> {
  const commands: Collection<string, Command> = new Collection();
  const commandsPath = path.join(process.cwd(), COMMANDS_FOLDER);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(`../${file}`)).default;

    if ("data" in command && "execute" in command) {
      commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  return commands;
}

export async function compareLocalAndServerCommands(localCommands: Collection<string, Command>) {
  try {
    const serverCommands = await getGuildSlashCommands();
    const installedCommandNames = serverCommands.map((command) => command["name"]);
    if (serverCommands) {
      const messages = await Promise.all(
        localCommands.map(async (command) => {
          return await compareLocalAndServerCommand(command, installedCommandNames);
        })
      );
      squareIt(messages);
    }
  } catch (err) {
    console.error(err);
  }
}

async function compareLocalAndServerCommand(localCommand: Command, serverCommandNames: string | any[]) {
  if (!serverCommandNames.includes(localCommand["name"])) {
    await postGuildSlashCommand(localCommand);
    return `Installing command <${localCommand["name"]}>`;
  } else {
    if (COMMAND_OVERRIDE) await postGuildSlashCommand(localCommand);
    return `Command <${localCommand["name"]}> is ${COMMAND_OVERRIDE ? "updated" : "already installed"}`;
  }
}
