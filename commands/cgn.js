import { SlashCommandBuilder } from 'discord.js';

const Ping = {
    data: new SlashCommandBuilder()
        .setName('cgn')
        .setDescription('Best Desc'),
    async execute(interaction) {
        await interaction.reply("Ya' I drink some BO'OH'O'WA'ER'");
    }
};

export default Ping;