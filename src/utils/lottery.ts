import { ChatInputCommandInteraction, EmbedData, Guild, GuildMember } from "discord.js";
import { getGuildMemberById, getUserById } from "../api/discord-api.js";
import { EMBEDS_COLOR, KEYV_LOTTERIES_PREFIX, DEFAULT_AVATAR_URL } from "../constants/app-constants.js";
import { Lottery } from "../types/Lottery.js";
import { getXRandomItemsFromArray } from "./array.js";

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
export async function buildEmbedsLottery(
  interaction: ChatInputCommandInteraction,
  lottery: Lottery
): Promise<EmbedData> {
  const guild = interaction?.guild as Guild;
  const createdFields = await Promise.all(
    lottery.playerIds.map(async (playerId: string) => {
      const player = await getGuildMemberById(guild, playerId);
      if (!player) throw Error(`Player ${playerId} not found to build lottery`);
      return {
        name: `• ${player.nickname ?? player.user.username} (${player.user.username}#${player.user.discriminator})`,
        value: "",
      };
    })
  );

  const owner = await getGuildMemberById(guild, lottery.ownerId);
  if (!owner) throw Error(`Player ${lottery.ownerId} not found to build lottery`);
  return {
    color: EMBEDS_COLOR,
    title: "List of players",
    // url: 'https://discord.js.org',
    author: {
      name: `${owner.nickname ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
      iconURL: owner.avatarURL() || DEFAULT_AVATAR_URL,
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

export async function buildEmbedsWinnersLottery(
  interaction: ChatInputCommandInteraction,
  lottery: Lottery,
  podium: { id: string; amount: number }[],
  amountTax: number
) {
  const guild = interaction?.guild as Guild;
  const createdFields = await Promise.all(
    podium.map(async (winnerDetails, index) => {
      const member = (await getGuildMemberById(guild, winnerDetails.id)) as GuildMember;
      return {
        name: `• ${member.nickname} (${member.user.username}#${member.user.discriminator})`,
        value: `#${index + 1} :coin: ${winnerDetails.amount}`,
      };
    })
  );

  if (amountTax) {
    createdFields.push({
      name: "Tax",
      value: `:coin: ${amountTax}`,
    });
  }

  const owner = await getGuildMemberById(guild, lottery.ownerId);
  if (!owner) throw Error(`Player ${lottery.ownerId} not found to build lottery`);

  return {
    color: EMBEDS_COLOR,
    title: `${podium.length ? "List of winners" : ""}`,
    // url: 'https://discord.js.org',
    author: {
      name: `${owner.nickname ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
      icon_url: owner.avatarURL() || DEFAULT_AVATAR_URL,
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
