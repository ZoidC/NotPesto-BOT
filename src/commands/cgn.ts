import { ChatInputCommandInteraction, Client, Interaction, SlashCommandBuilder } from "discord.js";

const Cgn = {
  data: new SlashCommandBuilder().setName("cgn").setDescription("Best player UK"),
  async execute(client: Client, interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply("Error!");
      return;
    }

    await interaction.reply(`Yea <@114458356491485185> drinks a lot of BO'OH'O'WA'ER'`);
  },
};

export default Cgn;
