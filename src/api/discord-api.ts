import { type Guild, type GuildMember } from "discord.js";

export async function getGuildMemberById(guild: Guild, id: string): Promise<GuildMember> {
	return await guild.members.fetch(id);
}
