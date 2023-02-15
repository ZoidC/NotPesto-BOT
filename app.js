import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { compareLocalAndServerCommands, loadLocalCommands } from './src/commands/manage/manage-commands.js';
import { APP_ID, DISCORD_TOKEN, GUILD_ID } from './src/constants/env-constants.js';
import { squareIt } from './src/utils/console.js';

// Check .env values
if (!APP_ID || !DISCORD_TOKEN || !GUILD_ID) {
    squareIt("Please configure the .env");
    process.exit();
}

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load Local Commands
client.commands = await loadLocalCommands();

// Setup
client.once(Events.ClientReady, current => {
    squareIt(`Logged in as ${current.user.tag}`);
    compareLocalAndServerCommands(client.commands.map(command => command.data.toJSON()));
});

// Login
client.login(DISCORD_TOKEN);

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