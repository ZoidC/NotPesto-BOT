import { SlashCommandBuilder } from 'discord.js';

const Cgn = {
    data: new SlashCommandBuilder()
        .setName('cgn')
        .setDescription('Best player UK'),
    async execute(interaction) {
        await interaction.reply(`Yea <@114458356491485185> drinks a lot of BO'OH'O'WA'ER'`);
    }
};

export default Cgn;