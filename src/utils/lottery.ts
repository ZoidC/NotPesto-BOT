import {
  APIEmbed,
  APIEmbedField,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  InteractionReplyOptions,
} from "discord.js";
import { getGuildMemberById } from "../api/discord-api.js";
import { EMBEDS_COLOR, KEYV_LOTTERIES_PREFIX, DEFAULT_AVATAR_URL } from "../constants/app-constants.js";
import { BANK, COIN, MEDAL, MEDAL_FIRST, MEDAL_SECOND, MEDAL_THIRD, TROPHY } from "../constants/discord-constants.js";
import { Lottery, Winner } from "../types/Lottery.js";
import { getXRandomItemsFromArray } from "./array.js";
import { buildAvatarUrl } from "./discord-tools.js";
import { getErrorMessage } from "./error.js";

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

export async function buildEmbedLottery(interaction: ChatInputCommandInteraction, lottery: Lottery): Promise<APIEmbed> {
  const guild = interaction?.guild as Guild;
  const playersList: string[] = await Promise.all(
    lottery.playerIds.map(async (playerId: string) => {
      const player = await getGuildMemberById(guild, playerId);
      if (!player) {
        console.error(`Player ${playerId} not found to build lottery`);
        return "Unknown player";
      }
      const playerName = `${player.nickname ?? player.user.username}`;
      const playerTag = `${player.user.username}#${player.user.discriminator}`;
      return `${playerName} (${playerTag})`;
    })
  );

  const playerPool: APIEmbedField = {
    name: `${playersList.length ? "Players" : ""}`,
    value: playersList.reduce((acc, player) => (acc += `• ${player}\n`), ""),
  };

  const fields: APIEmbedField[] = [];
  fields.push(EMBED_BACKSLASH_N);
  fields.push(playerPool);

  let description: string = "";
  description += `${COIN} Ticket price : ${lottery.price}\n`;
  description += `${COIN} Current pool : ${lottery.playerIds.length * lottery.price}`;

  const owner = await getGuildMemberById(guild, lottery.ownerId);
  if (!owner) throw Error(`Player ${lottery.ownerId} not found to build lottery`);

  return {
    color: EMBEDS_COLOR,
    title: "Lottery",
    // url: 'https://discord.js.org',
    author: {
      name: `${owner.nickname ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
      icon_url: owner.user.avatar ? buildAvatarUrl(owner.id, owner.user.avatar) : DEFAULT_AVATAR_URL,
    },
    description,
    thumbnail: {
      url: "https://i.imgur.com/aVq1dRh.png",
    },
    fields,
    // image: {
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
  interaction: ChatInputCommandInteraction,
  lottery: Lottery,
  podium: Winner[],
  amountTax: number
): Promise<APIEmbed> {
  const guild = interaction?.guild as Guild;

  let description: string = "";
  description += `${COIN} Ticket price : ${lottery.price}\n`;
  description += `${COIN} Current pool : ${lottery.playerIds.length * lottery.price}`;
  if (amountTax) {
    description += `\n${BANK} Guild tax : ${amountTax}`;
  }

  const winningPlayersList: string[] = await Promise.all(
    podium.map(async (winner: Winner) => {
      const player = await getGuildMemberById(guild, winner.playerId);
      if (!player) {
        console.error(`Player ${winner.playerId} not found to build lottery`);
        return "Unknown player";
      }
      const playerName = `${player.nickname ?? player.user.username}`;
      const playerTag = `${player.user.username}#${player.user.discriminator}`;
      return `${playerName} (${playerTag}) ${COIN} ${winner.amount}`;
    })
  );

  const winningPlayerPool: APIEmbedField = {
    name: `${winningPlayersList.length ? `${TROPHY} Winners ${TROPHY}` : ""}`,
    value: winningPlayersList.reduce((acc, player, index) => {
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
      return (acc += `${emoji} ${player}\n`);
    }, ""),
  };

  const fields: APIEmbedField[] = [];
  if (winningPlayersList.length) fields.push(EMBED_BACKSLASH_N);
  fields.push(winningPlayerPool);

  const owner = await getGuildMemberById(guild, lottery.ownerId);
  if (!owner) throw Error(`Player ${lottery.ownerId} not found to build lottery`);

  // ${podium.length ? "List of winners" : ""}

  return {
    color: EMBEDS_COLOR,
    title: "Lottery",
    // url: 'https://discord.js.org',
    author: {
      name: `${owner.nickname ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
      icon_url: owner.user.avatar ? buildAvatarUrl(owner.id, owner.user.avatar) : DEFAULT_AVATAR_URL,
    },
    description,
    thumbnail: {
      url: "https://i.imgur.com/aVq1dRh.png",
    },
    fields,
    // image: {
    //     url: 'https://i.imgur.com/aVq1dRh.png',
    // },
    // timestamp: new Date(lottery.endDate).toISOString(),
    // footer: {
    //   text: "Closing date",
    //   icon_url: "https://i.imgur.com/aVq1dRh.png",
    // },
  };
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
