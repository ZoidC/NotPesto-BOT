import "dotenv/config";
import { keyv } from "./src/db/keyv-db.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { syncSlashCommands, loadLocalSlashCommands } from "./src/commands/manage/manage-commands.js";
import { APP_ID, DISCORD_API, DISCORD_TOKEN, GUILD_ID, MONGODB_URI } from "./src/constants/env-constants.js";
import { squareIt } from "./src/utils/console.js";

// Check .env values
if (!APP_ID || !DISCORD_API || !DISCORD_TOKEN || !GUILD_ID || !MONGODB_URI) {
	squareIt("Please configure the .env");
	process.exit();
}

// Database
keyv.on("error", (err) => {
	console.error("Keyv connection error:", err);
});

// Client Discord
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
});

await client.login(DISCORD_TOKEN);

client.once(Events.ClientReady, async (current) => {
	squareIt(`Logged in as <${current.user.tag}>`);
	//   const fetchedGuilds = await client.guilds.fetch({});
	//   await Promise.all(
	//     Array.from(fetchedGuilds.values()).map(async (oauthGuild) => {
	//       const guild = await oauthGuild.fetch();
	//       return await guild.members.fetch();
	//     })
	//   );
});

await client.application?.commands.fetch({});
const localSlashCommands = await loadLocalSlashCommands();
await syncSlashCommands(localSlashCommands);

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = localSlashCommands.get(interaction.commandName);

	if (command == null) {
		console.error(`Command <${interaction.commandName}> was not found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (e) {
		console.error(e);
		// ephemeral: true means only the user who did the command sees the reply
		await interaction.reply({
			content: "Bip? Boup! .. **BONK** .. *dead*",
			ephemeral: true,
		});
	}
});
