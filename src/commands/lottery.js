import { SlashCommandBuilder } from 'discord.js';
import { addPlayerLottery, closeLottery, createLottery } from '../api/lottery-api.js';

/**
 * /lottery create <price>
 * /lottery add <player>
 * /lottery remove <player>
 * /lottery allow <player>
 * /lottery disallow <player>
 * /lottery show
 * /lottery roll
 */
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
                .setDescription('Add a new player to my lottery')
                // <Player>
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Set the user to add')
                        .setRequired(true)
                )
        )
        // Remove
        .addSubcommand(sc =>
            sc.setName('remove')
                .setDescription('Remove a player from my lottery')
                // <Player>
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Set the user to remove')
                        .setRequired(true)
                )
        )
        // Allow
        .addSubcommand(sc =>
            sc.setName('allow')
                .setDescription('Allow another player to update my lottery')
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
                .setDescription('Disallow another player to update my lottery')
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
                .setDescription('Show my lottery')
        )
        // Roll
        .addSubcommand(sc =>
            sc.setName('roll')
                .setDescription('Close my lottery')
        ),
    async execute(interaction) {
        const sc = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        let option;
        let res;

        switch (sc) {
            case "create":
                option = interaction.options.getInteger('price');
                res = await createLottery(guildId, userId, option);
                console.log(res);
                await interaction.reply(res.ok ? "Lottery has been created" : res.message);
                break;
            case "add":
                // user.id
                // user.username # user.discriminator
                // user.avatar
                option = interaction.options.getUser('user');
                res = await addPlayerLottery(guildId, userId, option);
                console.log(res);
                break;
            case "remove":
                // user.id
                // user.username # user.discriminator
                // user.avatar
                option = interaction.options.getUser('user');
                break;
            case "allow":
                // user.id
                // user.username # user.discriminator
                // user.avatar
                option = interaction.options.getUser('user');
                break;
            case "disallow":
                // user.id
                // user.username # user.discriminator
                // user.avatar
                option = interaction.options.getUser('user');
                break;
            case "show":

                break;
            case "roll":
                res = await closeLottery(guildId, userId);
                console.log(res);
                await interaction.reply(res.ok ? "Pesto won ?!" : res.message);
                break;
            default:
                await interaction.reply('Lottery what ?!');
        }
    }
};

export default Lottery;