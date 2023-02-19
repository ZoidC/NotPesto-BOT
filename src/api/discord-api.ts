import { Guild, GuildMember } from "discord.js";

export async function getGuildMemberById(guild: Guild, id: string): Promise<GuildMember> {
  return await guild.members.fetch(id);
}
