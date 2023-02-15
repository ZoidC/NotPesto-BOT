import { keyv } from "../db/keyv-db.js";
import { KEYV_LOTTERYS_KEY } from "../constants/app-constants.js";

// [
//     {
//         guild: 0,
//         owner: 0,
//         allowedUsers: [],
//         players: [],
//         price: 0
//     }
// ]

async function getLotterys() {
    return await keyv.get(KEYV_LOTTERYS_KEY);
}

function hasLotteryByIds(lotterys, guildId, userId) {
    let res = null;
    [...lotterys].forEach(lottery => {
        if (lottery.owner === userId && lottery.guild === guildId) {
            res = lottery;
        }
    });
    return res;
}

async function setLotterys(data) {
    return await keyv.set(KEYV_LOTTERYS_KEY, data);
}

// async function clearLotterys() {
//     return await keyv.clear(KEYV_LOTTERYS_KEY);
// }

export async function createLottery(guildId, userId, price) {
    const res = { ok: true, data: null, message: "" };
    let current;

    try {
        current = await getLotterys();
    } catch (e) {
        res.ok = false;
        res.message = "Could not get the Lottery";

        return res;
    }

    const newLottery = {
        guild: guildId,
        owner: userId,
        allowedUsers: [userId],
        players: [],
        price: price
    };

    // First creation
    if (!current) {
        try {
            res.ok = await setLotterys([newLottery]);
            res.data = newLottery;
        } catch (e) {
            res.ok = false;
            res.message = "Could not set the Lottery";
        }

        return res;
    } else {
        if (hasLotteryByIds(current, guildId, userId)) {
            res.ok = false;
            res.message = "Could not create the Lottery, you already have one in this Discord";

            return res;
        }

        current.push(newLottery);

        try {
            res.ok = await setLotterys(current);
            res.data = newLottery;
        } catch (e) {
            res.ok = false;
            res.message = "Could not set the Lottery";
        }

        return res;
    }
}