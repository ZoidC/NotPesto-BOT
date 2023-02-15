import { keyv } from "../db/keyv-db.js";
import { KEYV_LOTTERIES_PREFIX } from "../constants/app-constants.js";

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
        allowedUsers: [userId],
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

export async function addPlayerLottery(guildId, userId, userToAdd) {
    const res = { ok: true, data: null, message: "" };

    // ..

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