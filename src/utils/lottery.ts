import {
	type APIEmbed,
	type APIEmbedField,
	type ChatInputCommandInteraction,
	type InteractionReplyOptions,
} from "discord.js";
import { getGuildMemberById } from "../api/discord-api.js";
import { EMBEDS_COLOR, KEYV_LOTTERIES_PREFIX, DEFAULT_AVATAR_URL } from "../constants/app-constants.js";
import {
	BANK,
	COIN,
	MEDAL,
	MEDAL_FIRST,
	MEDAL_SECOND,
	MEDAL_THIRD,
	MONEYBAG,
	TICKET,
	TROPHY,
} from "../constants/discord-constants.js";
import { type Lottery, type Winner } from "../types/Lottery.js";
import { getXRandomItemsFromArray } from "./array.js";
import { buildAvatarUrl } from "./discord-tools.js";
import { getErrorMessage } from "./error.js";

// Could do some validation but.. :)
// Make sure the total of each array equal to 1
const WINNING_DISTRIBUTION = [[1], [0.6, 0.4], [0.5, 0.3, 0.2]];

export function createLotteriesName(guildId: string, userId: string) {
	return `${KEYV_LOTTERIES_PREFIX}_${guildId}_${userId}`;
}

export function hasActiveLottery(lotteries: Lottery[]): Lottery | undefined {
	let res;
	[...lotteries].forEach((lottery) => {
		if (lottery.active) {
			res = lottery;
		}
	});
	return res;
}

export function isAllowedToUpdate(lottery: Lottery, userId: string): boolean {
	return lottery.ownerId === userId || lottery.allowedUserIds.includes(userId);
}

export function isAllowedIn(lottery: Lottery, userId: string): boolean {
	return lottery.allowedUserIds.includes(userId);
}

export function isPlayerIn(lottery: Lottery, playerId: string): boolean {
	return lottery.playerIds.includes(playerId);
}

export function replaceActiveLottery(lotteries: Lottery[], newLottery: Lottery) {
	let done = false;
	const updatedLotteries = [...lotteries].map((lottery) => {
		if (lottery.active) {
			done = true;
			return newLottery;
		}

		return lottery;
	});

	if (!done) {
		throw new Error("there is no active Lottery");
	}

	return updatedLotteries;
}

export function handleWinnersLottery(lottery: Lottery, podiumSize: number, taxPercent: number) {
	const realPodiumSize = Math.min(lottery.playerIds.length, podiumSize);
	const totalAmount = lottery.price * lottery.playerIds.length;
	const amountTax = (totalAmount * taxPercent) / 100;
	const amountWinners = totalAmount - amountTax;
	const winners = getXRandomItemsFromArray(lottery.playerIds, realPodiumSize);
	let message = `${winners.length > 0 ? "Congratulations to" : ""}`;
	const podium = winners.map((player, index, array) => {
		message += ` ${pickMedalByIndex(index)} <@${player}>`;
		const winner: Winner = {
			playerId: player,
			amount: amountWinners * WINNING_DISTRIBUTION[array.length - 1][index],
		};
		return winner;
	});

	return { podium, amountTax, message };
}

// Embeds
const EMBED_BACKSLASH_N: APIEmbedField = {
	name: "\u200B",
	value: "",
};

export async function buildEmbedLottery(
	interaction: ChatInputCommandInteraction<"cached">,
	lottery: Lottery,
): Promise<APIEmbed> {
	const guild = interaction.guild;

	const owner = await getGuildMemberById(guild, lottery.ownerId);
	if (!owner) {
		throw Error(`Player ${lottery.ownerId} not found to build lottery`);
	}

	const description = `${TICKET} Ticket price ${COIN} ${lottery.price}`;

	const currentPot: APIEmbedField = {
		name: `${MONEYBAG} Current pot ${COIN} ${lottery.playerIds.length * lottery.price}`,
		value: "",
	};

	const playerPool: APIEmbedField = {
		name: `${lottery.playerIds.length > 0 ? "Players" : ""}`,
		value: lottery.playerIds.reduce((acc, playerId) => (acc += `<@!${playerId}>\n`), ""),
	};

	const fields: APIEmbedField[] = [];
	fields.push(EMBED_BACKSLASH_N);
	fields.push(currentPot);
	fields.push(EMBED_BACKSLASH_N);
	if (lottery.playerIds.length > 0) {
		fields.push(playerPool);
		fields.push(EMBED_BACKSLASH_N);
	}

	return {
		color: EMBEDS_COLOR,
		title: "Lottery",
		// Url: 'https://discord.js.org',
		author: {
			name: `${owner.nickname ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
			icon_url: owner.user.avatar ? buildAvatarUrl(owner.id, owner.user.avatar) : DEFAULT_AVATAR_URL,
		},
		description,
		thumbnail: {
			url: "https://i.imgur.com/aVq1dRh.png",
		},
		fields,
		// Image: {
		//     url: 'https://i.imgur.com/aVq1dRh.png',
		// },
		timestamp: new Date(lottery.endDate).toISOString(),
		footer: {
			text: "Closing date",
			icon_url: "https://i.imgur.com/aVq1dRh.png",
		},
	};
}

export async function buildEmbedWinnersLottery(
	interaction: ChatInputCommandInteraction<"cached">,
	lottery: Lottery,
	podium: Winner[],
	amountTax: number,
): Promise<APIEmbed> {
	const guild = interaction.guild;

	const owner = await getGuildMemberById(guild, lottery.ownerId);
	if (!owner) {
		throw Error(`Player ${lottery.ownerId} not found to build lottery`);
	}

	const description = `${TICKET} Ticket price ${COIN} ${lottery.price}`;

	const currentPot: APIEmbedField = {
		name: `${MONEYBAG} Pot ${COIN} ${lottery.playerIds.length * lottery.price}`,
		value: "",
	};

	const winningPlayerPool: APIEmbedField = {
		name: `${podium.length > 0 ? `${TROPHY} Winners ${TROPHY}` : ""}`,
		value: podium.reduce(
			(acc, winner, index) => (acc += `${pickMedalByIndex(index)} <@!${winner.playerId}> ${COIN} ${winner.amount}\n`),
			"",
		),
	};

	const guildTax: APIEmbedField = {
		name: `${BANK} Guild tax ${COIN} ${amountTax}`,
		value: "",
	};

	const fields: APIEmbedField[] = [];
	fields.push(EMBED_BACKSLASH_N);
	fields.push(currentPot);
	if (podium.length > 0) {
		fields.push(EMBED_BACKSLASH_N);
		fields.push(winningPlayerPool);
	}

	if (amountTax) {
		fields.push(EMBED_BACKSLASH_N);
		fields.push(guildTax);
	}

	return {
		color: EMBEDS_COLOR,
		title: "Lottery",
		// Url: 'https://discord.js.org',
		author: {
			name: `${owner.nickname ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
			icon_url: owner.user.avatar ? buildAvatarUrl(owner.id, owner.user.avatar) : DEFAULT_AVATAR_URL,
		},
		description,
		thumbnail: {
			url: "https://i.imgur.com/aVq1dRh.png",
		},
		fields,
		// Image: {
		//     url: 'https://i.imgur.com/aVq1dRh.png',
		// },
		// timestamp: new Date(lottery.endDate).toISOString(),
		// footer: {
		//   text: "Closing date",
		//   icon_url: "https://i.imgur.com/aVq1dRh.png",
		// },
	};
}

function pickMedalByIndex(index: number): string {
	let emoji: string;
	switch (index) {
		case 0:
			emoji = MEDAL_FIRST;
			break;
		case 1:
			emoji = MEDAL_SECOND;
			break;
		case 2:
			emoji = MEDAL_THIRD;
			break;
		default:
			emoji = MEDAL;
	}
	return emoji;
}

export async function doAndReply(action: () => Promise<InteractionReplyOptions>, baseErrorMessage: string) {
	let reply: InteractionReplyOptions;
	try {
		reply = await action();
	} catch (e) {
		reply = { content: `${baseErrorMessage}, ${getErrorMessage(e)}` };
	}
	return reply;
}
