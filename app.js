import 'dotenv/config';
import { keyv } from './src/db/keyv-db.js';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { compareLocalAndServerCommands, loadLocalCommands } from './src/commands/manage/manage-commands.js';
import { APP_ID, DISCORD_API, DISCORD_TOKEN, GUILD_ID, MONGODB_URI } from './src/constants/env-constants.js';
import { squareIt } from './src/utils/console.js';

// Check .env values
if (!APP_ID || !DISCORD_API || !DISCORD_TOKEN || !GUILD_ID || !MONGODB_URI) {
    squareIt("Please configure the .env");
    process.exit();
}

// Database
keyv.on('error', err => console.error('Keyv connection error:', err));

// Client Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.commands = await loadLocalCommands();

client.once(Events.ClientReady, current => {
    squareIt(`Logged in as <${current.user.tag}>`);
    compareLocalAndServerCommands(client.commands.map(command => command.data.toJSON()));
});

client.login(DISCORD_TOKEN);

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Command <${interaction.commandName}> was not found.`);
        return;
    }

    try {
        await command.execute(client, interaction);
    } catch (error) {
        console.error(error);
        // ephemeral: true means only the user who did the command sees the reply
        await interaction.reply({ content: 'Bip? Boup! .. **BONK** .. *dead*', ephemeral: true });
    }
});