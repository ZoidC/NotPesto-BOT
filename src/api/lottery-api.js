import { keyv } from "../db/keyv-db.js";
import { EMBEDS_COLOR, KEYV_LOTTERIES_PREFIX } from "../constants/app-constants.js";
import { getGuildUserById } from "./discord-api.js";
import { buildAvatarUrl } from "../utils/discord-tools.js";

// KEYV_LOTTERIES_PREFIX + "_" + GUILD_ID + "_" + USER_ID
// [
//     {
//         active: true,
//         createDate: "",
//         updateDate: "",
//         guild: 0,
//         owner: 0,
//         allowedUsers: [],
//         players: [],
//         price: 0
//     }
// ];

async function getLotteries(guildId, userId) {
    const lotteries = `${KEYV_LOTTERIES_PREFIX}_${guildId}_${userId}`;
    return await keyv.get(lotteries);;
}

function hasActiveLottery(lotteries) {
    let res = null;
    [...lotteries].forEach(lottery => {
        if (lottery.active) res = lottery;
    });
    return res;
}

function updateLotteries(lotteries, newLottery) {
    return [...lotteries].map(lottery => {
        if (lottery.active) return newLottery;
        return lottery;
    });
}

async function setLotteries(guildId, userId, data) {
    const lotteries = `${KEYV_LOTTERIES_PREFIX}_${guildId}_${userId}`;
    return await keyv.set(lotteries, data);
}

async function buildEmbedsLottery(lottery) {
    const owner = await getGuildUserById(lottery.owner);

    const createdFields = await Promise.all(lottery.players.map(async (playerId) => {
        const playerGuilds = await getGuildUserById(playerId);
        // buildAvatarUrl(playerGuilds.user.id, playerGuilds.user.avatar)
        return {
            name: `${playerGuilds.nick ?? playerGuilds.user.username}`,
            value: `${playerGuilds.user.username}#${playerGuilds.user.discriminator}`,
        };
    }));

    return {
        color: EMBEDS_COLOR,
        title: "List of players",
        // url: 'https://discord.js.org',
        author: {
            name: `${owner.nick} (${owner.user.username}#${owner.user.discriminator})`,
            icon_url: buildAvatarUrl(owner.user.id, owner.user.avatar),
            // url: 'https://discord.js.org',
        },
        // description: 'Some description there here',
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

// async function clearLotteries() {
//     const lotteries = `${KEYV_LOTTERIES_PREFIX}_${guildId}_${userId}`;
//     return await keyv.clear(lotteries);
// }

export async function createLottery(guildId, userId, price) {
    const res = { ok: true, data: null, message: "" };
    let current;

    try {
        current = await getLotteries(guildId, userId);
    } catch (e) {
        res.ok = false;
        res.message = "Could not get the Lotteries";

        return res;
    }

    const newDate = new Date();
    const newLottery = {
        active: true,
        createDate: newDate,
        updateDate: newDate,
        guild: guildId,
        owner: userId,
        allowedUsers: [],
        players: [],
        price: price
    };

    // First creation
    if (!current) {
        try {
            res.ok = await setLotteries(guildId, userId, [newLottery]);
            res.data = newLottery;
        } catch (e) {
            res.ok = false;
            res.message = "Could not set the Lotteries";
        }

        return res;
    } else {
        if (hasActiveLottery(current)) {
            res.ok = false;
            res.message = "Could not create the Lottery, you already have an active one";

            return res;
        }

        current.unshift(newLottery);

        try {
            res.ok = await setLotteries(guildId, userId, current);
            res.data = newLottery;
        } catch (e) {
            res.ok = false;
            res.message = "Could not set the Lotteries";
        }

        return res;
    }
}

export async function addPlayerLottery(guildId, userId, userToAdd, lotteryOwner) {
    const res = { ok: true, data: null, message: "" };
    let current;

    try {
        current = await getLotteries(guildId, lotteryOwner ? lotteryOwner.id : userId);
    } catch (e) {
        res.ok = false;
        res.message = `Could not get ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lotteries`;

        return res;
    }

    if (!current) {
        res.ok = false;
        res.message = `Could not add <@${userToAdd.id}> to ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lottery, ${lotteryOwner ? `<@${lotteryOwner.id}>` : "you"} don't have any Lottery`;
    } else {
        const activeLottery = hasActiveLottery(current);

        if (!activeLottery) {
            res.ok = false;
            res.message = `Could not add <@${userToAdd.id}> to ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lottery, ${lotteryOwner ? `<@${lotteryOwner.id}>` : "you"} don't have any active Lottery`;

            return res;
        }

        const isAllowed = activeLottery.owner === userId || activeLottery.allowedUsers.includes(userId);

        if (!isAllowed) {
            res.ok = false;
            res.message = `Could not add <@${userToAdd.id}> to ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lottery, you are not allowed to do it`;

            return res;
        }

        const isAlreadyIn = activeLottery.players.includes(userToAdd.id);

        if (isAlreadyIn) {
            res.ok = false;
            res.message = `Could not add <@${userToAdd.id}> to ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lottery, he is already in it`;

            return res;
        }

        activeLottery.players.push(userToAdd.id);

        const newLotteries = updateLotteries(current, activeLottery);

        try {
            res.ok = await setLotteries(guildId, lotteryOwner ? lotteryOwner.id : userId, newLotteries);
            res.data = await buildEmbedsLottery(activeLottery);
        } catch (e) {
            res.ok = false;
            res.message = `Could not set ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lotteries`;
        }

        return res;
    }
}

export async function removePlayerLottery(guildId, userId, userToRemove, lotteryOwner) {
    const res = { ok: true, data: null, message: "" };
    let current;

    try {
        current = await getLotteries(guildId, lotteryOwner ? lotteryOwner.id : userId);
    } catch (e) {
        res.ok = false;
        res.message = `Could not get ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lotteries`;

        return res;
    }

    if (!current) {
        res.ok = false;
        res.message = `Could not remove <@${userToRemove.id}> from ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lottery, ${lotteryOwner ? `<@${lotteryOwner.id}>` : "you"} don't have any Lottery`;
    } else {
        const activeLottery = hasActiveLottery(current);

        if (!activeLottery) {
            res.ok = false;
            res.message = `Could not remove <@${userToRemove.id}> from ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lottery, ${lotteryOwner ? `<@${lotteryOwner.id}>` : "you"} don't have any active Lottery`;

            return res;
        }

        const isAllowed = activeLottery.owner === userId || activeLottery.allowedUsers.includes(userId);

        if (!isAllowed) {
            res.ok = false;
            res.message = `Could not remove <@${userToRemove.id}> from ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lottery, you are not allowed to do it`;

            return res;
        }

        const isIn = activeLottery.players.includes(userToRemove.id);

        if (!isIn) {
            res.ok = false;
            res.message = `Could not remove <@${userToRemove.id}> from ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lottery, he is not in it`;

            return res;
        }

        activeLottery.players = activeLottery.players.filter((e) => e !== userToRemove.id);

        const newLotteries = updateLotteries(current, activeLottery);

        try {
            res.ok = await setLotteries(guildId, lotteryOwner ? lotteryOwner.id : userId, newLotteries);
            res.data = await buildEmbedsLottery(activeLottery);
        } catch (e) {
            res.ok = false;
            res.message = `Could not set ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "the"} Lotteries`;
        }

        return res;
    }
}

export async function showLottery(guildId, userId, userToTarget) {
    const res = { ok: true, data: null, message: "" };
    let current;

    try {
        current = await getLotteries(guildId, userToTarget ? userToTarget.id : userId);
    } catch (e) {
        res.ok = false;
        res.message = `Could not get ${userToTarget ? `<@${userToTarget.id}>'s` : "the"} Lotteries`;

        return res;
    }

    if (!current) {
        res.ok = false;
        res.message = `Could not show ${userToTarget ? `<@${userToTarget.id}>'s` : "the"} Lottery, ${userToTarget ? `<@${userToTarget.id}>` : "you"} don't have any Lottery`;
    } else {
        const activeLottery = hasActiveLottery(current);

        if (!activeLottery) {
            res.ok = false;
            res.message = `Could not show ${userToTarget ? `<@${userToTarget.id}>'s` : "the"} Lottery, ${userToTarget ? `<@${userToTarget.id}>` : "you"} don't have any active Lottery`;

            return res;
        }

        res.data = await buildEmbedsLottery(activeLottery);
    }

    return res;
}

export async function closeLottery(guildId, userId) {
    const res = { ok: true, data: null, message: "" };
    let current;

    try {
        current = await getLotteries(guildId, userId);
    } catch (e) {
        res.ok = false;
        res.message = "Could not get the Lotteries";

        return res;
    }

    if (!current) {
        res.ok = false;
        res.message = "Could not roll the Lottery, you don't have any Lottery";
    } else {
        const activeLottery = hasActiveLottery(current);

        if (!activeLottery) {
            res.ok = false;
            res.message = "Could not roll the Lottery, you don't have any active Lottery";

            return res;
        }

        activeLottery.active = false;

        // TO DO : Manage winners here

        const newLotteries = updateLotteries(current, activeLottery);

        try {
            res.ok = await setLotteries(guildId, userId, newLotteries);
            res.data = activeLottery;
        } catch (e) {
            res.ok = false;
            res.message = "Could not set the Lotteries";
        }
    }

    return res;
}