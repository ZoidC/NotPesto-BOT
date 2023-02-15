import 'dotenv/config';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { HasGuildCommands } from './commands/register/index.js';

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load Commands
client.commands = new Collection();
const commandsToQuery = [];
const commandsFolder = 'commands';
const commandsPath = path.join(process.cwd(), commandsFolder);
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(`./${commandsFolder}/${file}`)).default;
    // Build command to Query to the Servers
    commandsToQuery.push(command.data.toJSON());
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, commandsToQuery);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

// Listen
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});