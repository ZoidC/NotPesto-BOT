import { SlashCommandBuilder } from 'discord.js';

const Cgn = {
    data: new SlashCommandBuilder()
        .setName('cgn')
        .setDescription('Best player UK'),
    async execute(interaction) {
        await interaction.reply("Ya' I drink some BO'OH'O'WA'ER'");
    }
};

export default Cgn;