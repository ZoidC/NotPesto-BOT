import { SlashCommandBuilder } from 'discord.js';
import { addPlayerLottery, closeLottery, createLottery, removePlayerLottery, showLottery } from '../api/lottery-api.js';

const Lottery = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('Not rigged Lottery')
        // Create
        .addSubcommand(sc =>
            sc.setName('create')
                .setDescription('Create my new lottery')
                .addIntegerOption(option =>
                    // <Price>
                    option.setName('price')
                        .setDescription('Set the inscription price')
                        .setRequired(true)
                )
        )
        // Add
        .addSubcommand(sc =>
            sc.setName('add')
                .setDescription('Add a new player to a lottery')
                // <Player>
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Set the user to add')
                        .setRequired(true)
                )
                // <Player> (optional)
                .addUserOption(option =>
                    option.setName('lottery-owner')
                        .setDescription('Set the targeted lottery via the owner')
                )
        )
        // Remove
        .addSubcommand(sc =>
            sc.setName('remove')
                .setDescription('Remove a player from a lottery')
                // <Player>
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Set the user to remove')
                        .setRequired(true)
                )
                // <Player> (optional)
                .addUserOption(option =>
                    option.setName('lottery-owner')
                        .setDescription('Set the targeted lottery via the owner')
                )
        )
        // Allow
        .addSubcommand(sc =>
            sc.setName('allow')
                .setDescription('Allow another user to update my lottery')
                // <Player>
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Set the user to allow')
                        .setRequired(true)
                )
        )
        // Disallow
        .addSubcommand(sc =>
            sc.setName('disallow')
                .setDescription('Disallow another user to update my lottery')
                // <Player>
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Set the user to disallow')
                        .setRequired(true)
                )
        )
        // Show
        .addSubcommand(sc =>
            sc.setName('show')
                .setDescription('Show a lottery')
                // <Player> (optional)
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Set the user to disallow')
                )
        )
        // Roll
        .addSubcommand(sc =>
            sc.setName('roll')
                .setDescription('Close a lottery')
            // <Player> (optional)
            // .addUserOption(option =>
            //     option.setName('user')
            //         .setDescription('Set the user\'s lottery to close')
            // )
        ),
    async execute(interaction) {
        const sc = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        let option;
        let option2;
        let res;

        switch (sc) {
            case "create":
                option = interaction.options.getInteger('price');
                res = await createLottery(guildId, userId, option);
                if (!res.ok) console.log(res);
                await interaction.reply(res.ok ? "Lottery has been created" : res.message);
                break;
            case "add":
                option = interaction.options.getUser('user');
                option2 = interaction.options.getUser('lottery-owner');
                res = await addPlayerLottery(guildId, userId, option, option2);
                if (!res.ok) console.log(res);
                await interaction.reply(res.ok ? {
                    content: `<@${option.id}> has been added to ${option2 ? `<@${option2.id}>'s` : "the"} Lottery`,
                    embeds: [res.data]
                } : res.message);
                break;
            case "remove":
                option = interaction.options.getUser('user');
                option2 = interaction.options.getUser('lottery-owner');
                res = await removePlayerLottery(guildId, userId, option, option2);
                if (!res.ok) console.log(res);
                await interaction.reply(res.ok ? {
                    content: `<@${option.id}> has been removed from ${option2 ? `<@${option2.id}>'s` : "the"} Lottery`,
                    embeds: [res.data]
                } : res.message);
                break;
            case "allow":
                option = interaction.options.getUser('user');
                await interaction.reply("WIP : Command not done yet");
                break;
            case "disallow":
                option = interaction.options.getUser('user');
                await interaction.reply("WIP : Command not done yet");
                break;
            case "show":
                option = interaction.options.getUser('user');
                res = await showLottery(guildId, userId, option);
                if (!res.ok) console.log(res);
                await interaction.reply(res.ok ? { embeds: [res.data] } : res.message);
                break;
            case "roll":
                res = await closeLottery(guildId, userId);
                if (!res.ok) console.log(res);
                await interaction.reply(res.ok ? "WIP : Pesto won ?!" : res.message);
                break;
            default:
                await interaction.reply('Lottery what ?!');
        }
    }
};

export default Lottery;