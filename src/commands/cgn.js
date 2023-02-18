import { SlashCommandBuilder } from 'discord.js';

const Cgn = {
    data: new SlashCommandBuilder()
        .setName('cgn')
        .setDescription('Best player UK'),
    async execute(client, interaction) {
        // console.log("guildmanager:", client.guilds.cache)
        const fetchedGuild = await client.guilds.fetch(interaction.guild.id)
        // console.log(typeof interaction.guild.id)

        const members = await fetchedGuild.members.fetch([])

        let myArr = [];
        for (let i = 0; i < 5; i++) {
            myArr.push(fetchedGuild.members.fetch([]))
        }

        await Promise.all(myArr)

        console.log("MEMBERS:", members)
        // console.log(fetchedGuild.members.cache)
        
        fetchedGuild.members.cache.forEach((user) => {
            console.log(user.user.username)
        });
        await interaction.reply(`Yea <@114458356491485185> drinks a lot of BO'OH'O'WA'ER'`);
    }
};

export default Cgn;