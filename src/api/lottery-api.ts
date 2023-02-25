import { type ChatInputCommandInteraction, type GuildMember, type InteractionReplyOptions } from "discord.js";

import { keyv } from "../db/keyv-db.js";
import { type Lottery } from "../types/Lottery.js";

import {
	buildEmbedLottery,
	buildEmbedWinnersLottery,
	createLotteriesName,
	handleWinnersLottery,
	hasActiveLottery,
	isAllowedIn,
	isAllowedToUpdate,
	isPlayerIn,
	replaceActiveLottery,
} from "../utils/lottery.js";

async function getLotteries(guildId: string, userId: string): Promise<Lottery[]> {
	const lotteriesName = createLotteriesName(guildId, userId);
	let lotteries;

	try {
		lotteries = await keyv.get(lotteriesName);
		// Triggers when the db entry doesn't exist yet
		if (!lotteries) throw new Error();
	} catch (e) {
		throw new Error("there is no active Lottery");
	}

	return lotteries;
}
async function getActiveLottery(guildId: string, userId: string) {
	const lotteries = await getLotteries(guildId, userId);
	const activeLottery = hasActiveLottery(lotteries);

	if (!activeLottery) {
		throw new Error("there is no active Lottery");
	}

	return activeLottery;
}

async function setLotteries(guildId: string, userId: string, lotteries: Lottery[]) {
	const lotteriesName = createLotteriesName(guildId, userId);

	try {
		await keyv.set(lotteriesName, lotteries);
	} catch (e) {
		throw new Error("could not set the Lotteries");
	}

	return true;
}

async function updateActiveLottery(guildId: string, userId: string, updatedLottery: Lottery) {
	const lotteries = await getLotteries(guildId, userId);
	const newLotteries = replaceActiveLottery(lotteries, updatedLottery);
	await setLotteries(guildId, userId, newLotteries);

	return true;
}

export async function createLottery(
	interaction: ChatInputCommandInteraction<"cached">,
	guildId: string,
	userId: string,
	price: number,
	duration: number,
): Promise<InteractionReplyOptions> {
	const newDate = new Date().getTime();
	const newLottery: Lottery = {
		active: true,
		createDate: newDate,
		updateDate: newDate,
		// Maybe substract hours if needed
		endDate: newDate + duration * 24 * 60 * 60 * 1000,
		guildId,
		ownerId: userId,
		allowedUserIds: [],
		playerIds: [],
		price,
	};
	const res: InteractionReplyOptions = {
		embeds: [await buildEmbedLottery(interaction, newLottery)],
		content: "Lottery has been created",
	};
	let lotteries;

	try {
		lotteries = await getLotteries(guildId, userId);
	} catch (e) {
		// First creation
		await setLotteries(guildId, userId, [newLottery]);
		return res;
	}

	if (hasActiveLottery(lotteries)) {
		throw new Error("you already have an active one");
	}

	lotteries.unshift(newLottery);
	await setLotteries(guildId, userId, lotteries);

	return res;
}

export async function addPlayerLottery(
	interaction: ChatInputCommandInteraction<"cached">,
	guildId: string,
	userId: string,
	userToAdd: GuildMember,
	lotteryOwner: GuildMember,
): Promise<InteractionReplyOptions> {
	const res: InteractionReplyOptions = {
		content: `<@${userToAdd.id}> has been added to ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "your"} Lottery`,
	};
	const activeLottery = await getActiveLottery(guildId, lotteryOwner ? lotteryOwner.id : userId);

	if (!isAllowedToUpdate(activeLottery, userId)) {
		throw new Error("you are not allowed to do it");
	}

	if (isPlayerIn(activeLottery, userToAdd.id)) {
		throw new Error("he/she is already in it");
	}

	activeLottery.playerIds.push(userToAdd.id);
	res.embeds = [await buildEmbedLottery(interaction, activeLottery)];
	await updateActiveLottery(guildId, lotteryOwner ? lotteryOwner.id : userId, activeLottery);
	return res;
}

export async function removePlayerLottery(
	interaction: ChatInputCommandInteraction<"cached">,
	guildId: string,
	userId: string,
	userToRemove: GuildMember,
	owner: GuildMember,
): Promise<InteractionReplyOptions> {
	const res: InteractionReplyOptions = {
		content: `<@${userToRemove.id}> has been removed from ${owner ? `<@${owner.id}>'s` : "your"} Lottery`,
	};
	const activeLottery = await getActiveLottery(guildId, owner ? owner.id : userId);

	if (!isAllowedToUpdate(activeLottery, userId)) {
		throw new Error("you are not allowed to do it");
	}

	if (!isPlayerIn(activeLottery, userToRemove.id)) {
		throw new Error("he/she is not in it");
	}

	activeLottery.playerIds = activeLottery.playerIds.filter((e) => e !== userToRemove.id);
	res.embeds = [await buildEmbedLottery(interaction, activeLottery)];
	await updateActiveLottery(guildId, owner ? owner.id : userId, activeLottery);
	return res;
}

export async function showLottery(
	interaction: ChatInputCommandInteraction<"cached">,
	guildId: string,
	userId: string,
	owner: GuildMember,
): Promise<InteractionReplyOptions> {
	const res: InteractionReplyOptions = {
		content: "",
	};
	const activeLottery = await getActiveLottery(guildId, owner ? owner.id : userId);
	res.embeds = [await buildEmbedLottery(interaction, activeLottery)];
	return res;
}

export async function allowPlayerLottery(
	guildId: string,
	userId: string,
	userToAllow: GuildMember,
): Promise<InteractionReplyOptions> {
	const res: InteractionReplyOptions = {
		content: `<@${userToAllow.id}> has been allowed to udate your Lottery`,
	};

	if (userId === userToAllow.id) {
		res.content = "You are the owner...";
		return res;
	}

	const activeLottery = await getActiveLottery(guildId, userId);

	if (isAllowedToUpdate(activeLottery, userToAllow.id)) {
		throw new Error("he/she is already allowed to update your Lottery");
	}

	activeLottery.allowedUserIds.push(userToAllow.id);
	await updateActiveLottery(guildId, userId, activeLottery);
	return res;
}

export async function disallowPlayerLottery(
	guildId: string,
	userId: string,
	userToDisallow: GuildMember,
): Promise<InteractionReplyOptions> {
	const res: InteractionReplyOptions = {
		content: `<@${userToDisallow.id}> has been disallowed to udate your Lottery`,
	};

	if (userId === userToDisallow.id) {
		res.content = "You are the owner...";
		return res;
	}

	const activeLottery = await getActiveLottery(guildId, userId);

	if (!isAllowedIn(activeLottery, userToDisallow.id)) {
		throw new Error("he/she is not even allowed to update your Lottery");
	}

	activeLottery.allowedUserIds = activeLottery.allowedUserIds.filter((e) => e !== userToDisallow.id);
	await updateActiveLottery(guildId, userId, activeLottery);
	return res;
}

export async function closeLottery(
	interaction: ChatInputCommandInteraction<"cached">,
	guildId: string,
	userId: string,
	podiumSize: number,
	taxPercent: number,
): Promise<InteractionReplyOptions> {
	const activeLottery = await getActiveLottery(guildId, userId);
	const { podium, amountTax, message } = handleWinnersLottery(activeLottery, podiumSize, taxPercent);
	const res: InteractionReplyOptions = {
		content: message,
	};
	activeLottery.active = false;
	res.embeds = [await buildEmbedWinnersLottery(interaction, activeLottery, podium, amountTax)];
	await updateActiveLottery(guildId, userId, activeLottery);
	return res;
}
