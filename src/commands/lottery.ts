import {
  ChatInputCommandInteraction,
  Client,
  CommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  User,
} from "discord.js";
import {
  addPlayerLottery,
  allowPlayerLottery,
  closeLottery,
  createLottery,
  disallowPlayerLottery,
  removePlayerLottery,
  showLottery,
} from "../api/lottery-api.js";
import { doAndAnswer } from "../utils/lottery.js";

const Lottery = {
  data: new SlashCommandBuilder()
    .setName("lottery")
    .setDescription("Not rigged Lottery")
    // Create
    .addSubcommand((sc) =>
      sc
        .setName("create")
        .setDescription("Create my new lottery")
        // <Price>
        .addIntegerOption((option) =>
          option.setName("price").setDescription("Set the inscription price").setRequired(true)
        )
        // <Duration>
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("Duration in days (1 to 30)")
            .setMinValue(1)
            .setMaxValue(30)
            .setRequired(true)
        )
    )
    // Add
    .addSubcommand((sc) =>
      sc
        .setName("add")
        .setDescription("Add a new player to a lottery")
        // <Player>
        .addUserOption((option) => option.setName("user").setDescription("Set the user to add").setRequired(true))
        // <Player> (optional)
        .addUserOption((option) =>
          option.setName("lottery-owner").setDescription("Set the targeted lottery via the owner")
        )
    )
    // Remove
    .addSubcommand((sc) =>
      sc
        .setName("remove")
        .setDescription("Remove a player from a lottery")
        // <Player>
        .addUserOption((option) => option.setName("user").setDescription("Set the user to remove").setRequired(true))
        // <Player> (optional)
        .addUserOption((option) =>
          option.setName("lottery-owner").setDescription("Set the targeted lottery via the owner")
        )
    )
    // Allow
    .addSubcommand((sc) =>
      sc
        .setName("allow")
        .setDescription("Allow another user to update my lottery")
        // <Player>
        .addUserOption((option) => option.setName("user").setDescription("Set the user to allow").setRequired(true))
    )
    // Disallow
    .addSubcommand((sc) =>
      sc
        .setName("disallow")
        .setDescription("Disallow another user to update my lottery")
        // <Player>
        .addUserOption((option) => option.setName("user").setDescription("Set the user to disallow").setRequired(true))
    )
    // Show
    .addSubcommand((sc) =>
      sc
        .setName("show")
        .setDescription("Show a lottery")
        // <Player> (optional)
        .addUserOption((option) => option.setName("user").setDescription("Set the user to disallow"))
    )
    // Roll
    .addSubcommand((sc) =>
      sc
        .setName("roll")
        .setDescription("Close a lottery")
        // <PodiumSize>
        .addIntegerOption((option) =>
          option
            .setName("podium-size")
            .setDescription("Set the amount of place on the podium (1 to 3)")
            .setMinValue(1)
            .setMaxValue(3)
            .setRequired(true)
        )
        // <Tax> (optional)
        .addIntegerOption((option) =>
          option.setName("tax").setDescription("Set the tax in % (0 to 100)").setMinValue(0).setMaxValue(100)
        )
    ),
  async execute(client: Client, interaction: ChatInputCommandInteraction) {
    const subCommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    let answer;

    if (!guildId || !userId) throw Error("userId or guildId were not present when command was invoked");

    switch (subCommand) {
      case "create":
        {
          let option: any = interaction.options.getInteger("price");
          let option2: any = interaction.options.getInteger("duration");
          if (!option || !option2) break;

          answer = await doAndAnswer(
            async () => await createLottery(client, guildId, userId, option, option2),
            `Could not create your Lottery`
          );
        }
        break;
      case "add":
        {
          let option: any = interaction.options.getUser("user");
          let option2: any = interaction.options.getUser("lottery-owner");
          answer = await doAndAnswer(
            async () => await addPlayerLottery(client, guildId, userId, option, option2),
            `Could not add <@${option?.id}> to ${option2 ? `<@${option2.id}>'s` : "your"} Lottery`
          );
        }
        break;
      case "remove":
        {
          let option: any = interaction.options.getUser("user");
          let option2: any = interaction.options.getUser("lottery-owner");

          answer = await doAndAnswer(
            async () => await removePlayerLottery(client, guildId, userId, option, option2),
            `Could not remove <@${option?.id}> from ${option2 ? `<@${option2.id}>'s` : "your"} Lottery`
          );
        }
        break;
      case "allow":
        {
          let option: any = interaction.options.getUser("user");
          answer = await doAndAnswer(
            async () => allowPlayerLottery(guildId, userId, option),
            `<@${option.id}> could not be allowed to update your Lottery`
          );
        }
        break;
      case "disallow":
        {
          let option: any = interaction.options.getUser("user");
          if (!option) break;

          answer = await doAndAnswer(
            async () => disallowPlayerLottery(guildId, userId, option),
            `<@${option.id}> could not be disallowed to update your Lottery`
          );
        }
        break;
      case "show":
        {
          let option: any = interaction.options.getUser("user");

          answer = await doAndAnswer(
            async () => await showLottery(client, guildId, userId, option),
            `Could not show ${option ? `<@${option.id}>'s` : "your"} Lottery`
          );
        }
        break;
      case "roll":
        {
          let option: any = interaction.options.getInteger("podium-size");
          let option2: any = interaction.options.getInteger("tax");
          answer = await doAndAnswer(
            async () => await closeLottery(client, guildId, userId, option, option2),
            `Could not roll your Lottery`
          );
        }
        break;
      default:
        answer = { content: "Lottery what ?!" };
    }

    await interaction.reply(answer);
  },
};

export default Lottery;
