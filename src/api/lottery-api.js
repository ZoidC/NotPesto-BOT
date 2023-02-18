import { keyv } from "../db/keyv-db.js";
import { KEYV_LOTTERIES_PREFIX } from "../constants/app-constants.js";
import { getXRandomItemsFromArray } from "../utils/array.js";
import { buildEmbedsLottery, hasActiveLottery, updateLotteries } from "../utils/lottery.js";

// KEYV_LOTTERIES_PREFIX + "_" + GUILD_ID + "_" + USER_ID
// [
//     {
//         active: true,
//         createDate: "",
//         updateDate: "",
//         endDate: "",
//         guild: 0,
//         owner: 0,
//         allowedUsers: [],
//         players: [],
//         price: 0
//     }
// ];

async function getLotteries(guildId, userId) {
    const lotteries = `${KEYV_LOTTERIES_PREFIX}_${guildId}_${userId}`;
    return await keyv.get(lotteries);
}

async function setLotteries(guildId, userId, data) {
    const lotteries = `${KEYV_LOTTERIES_PREFIX}_${guildId}_${userId}`;
    return await keyv.set(lotteries, data);
}

// async function clearLotteries() {
//     const lotteries = `${KEYV_LOTTERIES_PREFIX}_${guildId}_${userId}`;
//     return await keyv.clear(lotteries);
// }

export async function createLottery(guildId, userId, price, duration) {
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
        endDate: new Date(newDate.getTime() + (duration * 24 * 60 * 60 * 1000)),
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
    }

    return res;
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
    }

    return res;
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
    }

    return res;
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

export async function allowPlayerLottery(guildId, userId, userToAllow) {
    const res = { ok: true, data: null, message: "" };
    let current;

    try {
        current = await getLotteries(guildId, userId);
    } catch (e) {
        res.ok = false;
        res.message = `Could not get the Lotteries`;

        return res;
    }

    if (!current) {
        res.ok = false;
        res.message = `Could not allow <@${userToAllow.id}> to the Lottery, you don't have any Lottery`;
    } else {
        const activeLottery = hasActiveLottery(current);

        if (!activeLottery) {
            res.ok = false;
            res.message = `Could not allow <@${userToAllow.id}> to the Lottery, you don't have any active Lottery`;

            return res;
        }

        const isAlreadyAllowed = activeLottery.allowedUsers.includes(userToAllow.id);

        if (isAlreadyAllowed) {
            res.ok = false;
            res.message = `Could not allow <@${userToAllow.id}> to the Lottery, he is already allowed`;

            return res;
        }

        activeLottery.allowedUsers.push(userToAllow.id);

        const newLotteries = updateLotteries(current, activeLottery);

        try {
            res.ok = await setLotteries(guildId, userId, newLotteries);
            res.data = activeLottery;
        } catch (e) {
            res.ok = false;
            res.message = `Could not set the Lotteries`;
        }
    }

    return res;
}

export async function disallowPlayerLottery(guildId, userId, userToDisallow) {
    const res = { ok: true, data: null, message: "" };
    let current;

    try {
        current = await getLotteries(guildId, userId);
    } catch (e) {
        res.ok = false;
        res.message = `Could not get the Lotteries`;

        return res;
    }

    if (!current) {
        res.ok = false;
        res.message = `Could not disallow <@${userToDisallow.id}> to the Lottery, you don't have any Lottery`;
    } else {
        const activeLottery = hasActiveLottery(current);

        if (!activeLottery) {
            res.ok = false;
            res.message = `Could not disallow <@${userToDisallow.id}> to the Lottery, you don't have any active Lottery`;

            return res;
        }

        const isAllowed = activeLottery.allowedUsers.includes(userToDisallow.id);

        if (!isAllowed) {
            res.ok = false;
            res.message = `Could not disallow <@${userToDisallow.id}> to the Lottery, he is not even allowed`;

            return res;
        }

        activeLottery.allowedUsers = activeLottery.allowedUsers.filter((e) => e !== userToDisallow.id);

        const newLotteries = updateLotteries(current, activeLottery);

        try {
            res.ok = await setLotteries(guildId, userId, newLotteries);
            res.data = activeLottery;
        } catch (e) {
            res.ok = false;
            res.message = `Could not set the Lotteries`;
        }
    }

    return res;
}

export async function closeLottery(guildId, userId, podiumSize, taxPercent) {
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

        // Could do some validation but.. :)
        // Make sure the total of each array equal to 1
        const WINNING_DISTRIBUTION = [
            [1],
            [0.6, 0.4],
            [0.5, 0.3, 0.2]
        ];
        const realPodiumSize = Math.min(activeLottery.players.length, podiumSize);
        const totalAmount = activeLottery.price * activeLottery.players.length;
        const amountTax = totalAmount * taxPercent / 100;
        const amountWinners = totalAmount - amountTax;
        const winners = getXRandomItemsFromArray(activeLottery.players, realPodiumSize);
        let buildMessage = `${winners.length ? "Congratulations to" : ""}`;
        const podium = winners.map((player, index, array) => {
            buildMessage += ` #${index + 1} <@${player}>`;
            return {
                id: player,
                amount: amountWinners * WINNING_DISTRIBUTION[array.length - 1][index]
            };
        });

        const newLotteries = updateLotteries(current, activeLottery);

        try {
            res.ok = await setLotteries(guildId, userId, newLotteries);
            res.data = await buildEmbedsWinnersLottery(activeLottery, podium, amountTax);
            res.message = buildMessage;
        } catch (e) {
            res.ok = false;
            res.message = "Could not set the Lotteries";
        }
    }

    return res;
}