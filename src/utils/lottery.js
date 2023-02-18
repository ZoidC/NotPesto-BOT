import { getGuildUserById } from "../api/discord-api.js";
import { EMBEDS_COLOR } from "../constants/app-constants.js";
import { buildAvatarUrl } from "./discord-tools.js";

export function hasActiveLottery(lotteries) {
    let res = null;
    [...lotteries].forEach(lottery => {
        if (lottery.active) res = lottery;
    });
    return res;
}

export function updateLotteries(lotteries, newLottery) {
    return [...lotteries].map(lottery => {
        if (lottery.active) return newLottery;
        return lottery;
    });
}

// Embeds
export async function buildEmbedsLottery(lottery) {
    const owner = await getGuildUserById(lottery.owner);

    const createdFields = await Promise.all(lottery.players.map(async (playerId) => {
        const playerGuilds = await getGuildUserById(playerId);
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

export async function buildEmbedsWinnersLottery(lottery, podium, amountTax) {
    const owner = await getGuildUserById(lottery.owner);

    const createdFields = await Promise.all(podium.map(async (player, index) => {
        const playerGuilds = await getGuildUserById(player.id);
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