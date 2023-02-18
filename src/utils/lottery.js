import { getGuildUserById } from "../api/discord-api.js";
import { EMBEDS_COLOR, KEYV_LOTTERIES_PREFIX } from "../constants/app-constants.js";
import { getXRandomItemsFromArray } from "./array.js";
import { buildAvatarUrl } from "./discord-tools.js";

// Could do some validation but.. :)
// Make sure the total of each array equal to 1
const WINNING_DISTRIBUTION = [
    [1],
    [0.6, 0.4],
    [0.5, 0.3, 0.2]
];

export function createLotteriesName(guildId, userId) {
    return `${KEYV_LOTTERIES_PREFIX}_${guildId}_${userId}`;
}
export function hasActiveLottery(lotteries) {
    let res = null;
    [...lotteries].forEach(lottery => {
        if (lottery.active) res = lottery;
    });
    return res;
}

export function isAllowedToUpdate(lottery, userId) {
    return lottery.owner === userId || lottery.allowedUsers.includes(userId);
}
export function isAllowedIn(lottery, userId) {
    return lottery.allowedUsers.includes(userId);
}

export function isPlayerIn(lottery, playerId) {
    return lottery.players.includes(playerId);
}

export function replaceActiveLottery(lotteries, newLottery) {
    let done = false;
    const updatedLotteries = [...lotteries].map(lottery => {
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

export function handleWinnersLottery(lottery, podiumSize, taxPercent) {
    const realPodiumSize = Math.min(lottery.players.length, podiumSize);
    const totalAmount = lottery.price * lottery.players.length;
    const amountTax = totalAmount * taxPercent / 100;
    const amountWinners = totalAmount - amountTax;
    const winners = getXRandomItemsFromArray(lottery.players, realPodiumSize);
    let message = `${winners.length ? "Congratulations to" : ""}`;
    const podium = winners.map((player, index, array) => {
        message += ` #${index + 1} <@${player}>`;
        return {
            id: player,
            amount: amountWinners * WINNING_DISTRIBUTION[array.length - 1][index]
        };
    });

    return { podium, amountTax, message };
}

// Embeds
export async function buildEmbedsLottery(client, lottery) {
    const owner = await getGuildUserById(client, lottery.owner);
    const createdFields = await Promise.all(lottery.players.map(async (playerId) => {
        const playerGuilds = await getGuildUserById(client, playerId);
        return {
            name: `• ${playerGuilds.nick ?? playerGuilds.user.username} (${playerGuilds.user.username}#${playerGuilds.user.discriminator})`,
            value: '',
        };
    }));

    return {
        color: EMBEDS_COLOR,
        title: "List of players",
        // url: 'https://discord.js.org',
        author: {
            name: `${owner.nick ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
            icon_url: buildAvatarUrl(owner.user.id, owner.user.avatar),
            // url: 'https://discord.js.org',
        },
        description: `:coin: ${lottery.price}`,
        thumbnail: {
            url: 'https://i.imgur.com/aVq1dRh.png',
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

export async function buildEmbedsWinnersLottery(client, lottery, podium, amountTax) {

    const owner = await getGuildUserById(client, lottery.owner);
    const createdFields = await Promise.all(podium.map(async (player, index) => {
        const playerGuilds = await getGuildUserById(client, player.id);
        return {
            name: `• ${playerGuilds.nick ?? playerGuilds.user.username} (${playerGuilds.user.username}#${playerGuilds.user.discriminator})`,
            value: `#${index + 1} :coin: ${player.amount}`,
        };
    }));

    if (amountTax) {
        createdFields.push({
            name: "Tax",
            value: `:coin: ${amountTax}`
        });
    }

    return {
        color: EMBEDS_COLOR,
        title: `${podium.length ? "List of winners" : ""}`,
        // url: 'https://discord.js.org',
        author: {
            name: `${owner.nick ?? owner.user.username} (${owner.user.username}#${owner.user.discriminator})`,
            icon_url: buildAvatarUrl(owner.user.id, owner.user.avatar),
            // url: 'https://discord.js.org',
        },
        description: `:coin: ${lottery.price}`,
        thumbnail: {
            url: 'https://i.imgur.com/aVq1dRh.png',
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

export async function doAndAnswer(action, baseErrorMessage) {
    let answer;
    try {
        const res = await action();
        answer = {
            content: res.message,
            ...(res.data && { embeds: [res.data] })
        };
    } catch (e) {
        answer = `${baseErrorMessage}, ${e.message}`;
    }
    return answer;
}