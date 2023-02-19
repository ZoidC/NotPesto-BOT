import { ChatInputCommandInteraction, EmbedData, GuildMember } from "discord.js";
import { keyv } from "../db/keyv-db.js";
import { Lottery } from "../types/Lottery.js";
import {
  buildEmbedsLottery,
  buildEmbedsWinnersLottery,
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

interface CreateLotteryResponse {
  data: EmbedData;
  message: string;
}
export async function createLottery(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  userId: string,
  price: number,
  duration: number
): Promise<CreateLotteryResponse> {
  const newDate = new Date();
  const newLottery: Lottery = {
    active: true,
    createDate: newDate,
    updateDate: newDate,
    endDate: new Date(newDate.getTime() + duration * 24 * 60 * 60 * 1000),
    guildId: guildId,
    ownerId: userId,
    allowedUserIds: [],
    playerIds: [],
    price: price,
  };
  const res = {
    data: await buildEmbedsLottery(interaction, newLottery),
    message: "Lottery has been created",
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
  interaction: ChatInputCommandInteraction,
  guildId: string,
  userId: string,
  userToAdd: GuildMember,
  lotteryOwner: GuildMember
): Promise<any> {
  const message = `<@${userToAdd.id}> has been added to ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "your"} Lottery`;
  const activeLottery = await getActiveLottery(guildId, lotteryOwner ? lotteryOwner.id : userId);

  if (!isAllowedToUpdate(activeLottery, userId)) {
    throw new Error("you are not allowed to do it");
  }

  if (isPlayerIn(activeLottery, userToAdd.id)) {
    throw new Error("he/she is already in it");
  }

  activeLottery.playerIds.push(userToAdd.id);
  const data = await buildEmbedsLottery(interaction, activeLottery);
  await updateActiveLottery(guildId, lotteryOwner ? lotteryOwner.id : userId, activeLottery);
  return { data, message };
}

export async function removePlayerLottery(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  userId: string,
  userToRemove: GuildMember,
  owner: GuildMember
) {
  const message = `<@${userToRemove.id}> has been removed from ${owner ? `<@${owner.id}>'s` : "your"} Lottery`;
  const activeLottery = await getActiveLottery(guildId, owner ? owner.id : userId);

  if (!isAllowedToUpdate(activeLottery, userId)) {
    throw new Error("you are not allowed to do it");
  }

  if (!isPlayerIn(activeLottery, userToRemove.id)) {
    throw new Error("he/she is not in it");
  }

  activeLottery.playerIds = activeLottery.playerIds.filter((e) => e !== userToRemove.id);
  const data = await buildEmbedsLottery(interaction, activeLottery);
  await updateActiveLottery(guildId, owner ? owner.id : userId, activeLottery);
  return { data, message };
}

export async function showLottery(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  userId: string,
  owner: GuildMember
) {
  const message = "";
  const activeLottery = await getActiveLottery(guildId, owner ? owner.id : userId);
  console.log("active: ", activeLottery);
  const data = await buildEmbedsLottery(interaction, activeLottery);
  console.log("data:", data);
  return { data, message };
}

export async function allowPlayerLottery(guildId: string, userId: string, userToAllow: GuildMember) {
  const res = {
    data: null,
    message: `<@${userToAllow.id}> has been allowed to udate your Lottery`,
  };

  if (userId === userToAllow.id) {
    res.message = "You are the owner...";
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

export async function disallowPlayerLottery(guildId: string, userId: string, userToDisallow: GuildMember) {
  const res = {
    data: null,
    message: `<@${userToDisallow.id}> has been disallowed to udate your Lottery`,
  };

  if (userId === userToDisallow.id) {
    res.message = "You are the owner...";
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
  interaction: ChatInputCommandInteraction,
  guildId: string,
  userId: string,
  podiumSize: number,
  taxPercent: number
) {
  const activeLottery = await getActiveLottery(guildId, userId);
  const { podium, amountTax, message } = handleWinnersLottery(activeLottery, podiumSize, taxPercent);

  activeLottery.active = false;
  const data = await buildEmbedsWinnersLottery(interaction, activeLottery, podium, amountTax);
  await updateActiveLottery(guildId, userId, activeLottery);
  return { data, message };
}
