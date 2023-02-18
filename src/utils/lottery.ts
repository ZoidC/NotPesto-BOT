import { Client, Embed, EmbedData } from "discord.js";
import { getGuildMemberById } from "../api/discord-api.js";
import { EMBEDS_COLOR, KEYV_LOTTERIES_PREFIX } from "../constants/app-constants.js";
import { Lottery } from "../types/Lottery.js";
import { getXRandomItemsFromArray } from "./array.js";
import { buildAvatarUrl } from "./discord-tools.js";

// Could do some validation but.. :)
// Make sure the total of each array equal to 1
const WINNING_DISTRIBUTION = [[1], [0.6, 0.4], [0.5, 0.3, 0.2]];

export function createLotteriesName(guildId: string, userId: string) {
  return `${KEYV_LOTTERIES_PREFIX}_${guildId}_${userId}`;
}
export function hasActiveLottery(lotteries: Array<Lottery>): Lottery | null {
  let res = null;
  [...lotteries].forEach((lottery) => {
    if (lottery.active) res = lottery;
  });
  return res;
}

export function isAllowedToUpdate(lottery: Lottery, userId: string) {
  return lottery.ownerId === userId || lottery.allowedUserIds.includes(userId);
}
export function isAllowedIn(lottery: Lottery, userId: string) {
  return lottery.allowedUserIds.includes(userId);
}

export function isPlayerIn(lottery: Lottery, playerId: string) {
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
  let message = `${winners.length ? "Congratulations to" : ""}`;
  const podium = winners.map((player, index, array) => {
    message += ` #${index + 1} <@${player}>`;
    return {
      id: player,
      amount: amountWinners * WINNING_DISTRIBUTION[array.length - 1][index],
    };
  });

  return { podium, amountTax, message };
}

// Embeds
export async function buildEmbedsLottery(client: Client, lottery: Lottery): Promise<EmbedData> {
  const createdFields = await Promise.all(
    lottery.playerIds.map(async (playerId: string) => {
      const player = await getGuildMemberById(client, playerId);
      if (!player) throw Error(`Player ${playerId} not found to build lottery`);
      return {
        name: `• ${player.nickname ?? player.user.username} (${player.user.username}#${player.user.discriminator})`,
        value: "",
      };
    })
  );

  const owner = await getGuildMemberById(client, lottery.ownerId);
  if (!owner) throw Error(`Player ${lottery.ownerId} not found to build lottery`);
  return {
    color: EMBEDS_COLOR,
    title: "List of players",
    // url: 'https://discord.js.org',
    author: {
      name: `${owner.nickname ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
      iconURL: buildAvatarUrl(owner.user.id, owner.user.avatarURL),
      // url: 'https://discord.js.org',
    },
    description: `:coin: ${lottery.price}`,
    thumbnail: {
      url: "https://i.imgur.com/aVq1dRh.png",
    },
    fields: createdFields,
    // image: {
    //     url: 'https://i.imgur.com/aVq1dRh.png',
    // },
    // timestamp: new Date().toISOString(),
    // footer: {
    //     text: 'Some footer text here',
    //     icon_url: 'https://i.imgur.com/aVq1dRh.png',
    // }
  };
}

export async function buildEmbedsWinnersLottery(client: Client, lottery: Lottery, podium: any[], amountTax: number) {
  const createdFields = await Promise.all(
    podium.map(async (player, index) => {
      return {
        name: `• ${player.nickname ?? player.user.username} (${player.user.username}#${player.user.discriminator})`,
        value: `#${index + 1} :coin: ${player.amount}`,
      };
    })
  );

  if (amountTax) {
    createdFields.push({
      name: "Tax",
      value: `:coin: ${amountTax}`,
    });
  }

  const owner = await getGuildMemberById(client, lottery.ownerId);
  if (!owner) throw Error(`Player ${lottery.ownerId} not found to build lottery`);

  return {
    color: EMBEDS_COLOR,
    title: `${podium.length ? "List of winners" : ""}`,
    // url: 'https://discord.js.org',
    author: {
      name: `${owner.nickname ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
      icon_url: buildAvatarUrl(owner.user.id, owner.user.avatar),
      // url: 'https://discord.js.org',
    },
    description: `:coin: ${lottery.price}`,
    thumbnail: {
      url: "https://i.imgur.com/aVq1dRh.png",
    },
    fields: createdFields,
    // image: {
    //     url: 'https://i.imgur.com/aVq1dRh.png',
    // },
    // timestamp: new Date().toISOString(),
    // footer: {
    //     text: 'Some footer text here',
    //     icon_url: 'https://i.imgur.com/aVq1dRh.png',
    // }
  };
}

export async function doAndAnswer(action: () => any, baseErrorMessage: string) {
  let answer;
  try {
    const res = await action();
    answer = {
      content: res.message,
      ...(res.data && { embeds: [res.data] }),
    };
  } catch (e: any) {
    answer = `${baseErrorMessage}, ${e.message}`;
  }
  return answer;
}
