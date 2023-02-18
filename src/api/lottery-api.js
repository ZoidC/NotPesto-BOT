import { keyv } from "../db/keyv-db.js";
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
    const lotteriesName = createLotteriesName(guildId, userId);
    let lotteries;

    try {
        lotteries = await keyv.get(lotteriesName);
        // Triggers when the db entry doesn't exist yet
        if (!lotteries) throw new Error();
    } catch (e) {
        // throw new Error("could not get the Lotteries");
        throw new Error("there is no active Lottery");
    }

    return lotteries;
}

async function getActiveLottery(guildId, userId) {
    const lotteries = await getLotteries(guildId, userId);
    const activeLottery = hasActiveLottery(lotteries);

    if (!activeLottery) {
        throw new Error("there is no active Lottery");
    }

    return activeLottery;
}

async function setLotteries(guildId, userId, lotteries) {
    const lotteriesName = createLotteriesName(guildId, userId);

    try {
        await keyv.set(lotteriesName, lotteries);
    } catch (e) {
        throw new Error("could not set the Lotteries");
    }

    return true;
}

async function updateActiveLottery(guildId, userId, updatedLottery) {
    const lotteries = await getLotteries(guildId, userId);
    const newLotteries = replaceActiveLottery(lotteries, updatedLottery);
    await setLotteries(guildId, userId, newLotteries);

    return true;
}

async function clearLotteries(guildId, userId) {
    const lotteriesName = createLotteriesName(guildId, userId);

    try {
        await keyv.clear(lotteriesName);
    } catch (e) {
        throw new Error("could not clear the Lotteries");
    }

    return true;
}

export async function createLottery(guildId, userId, price, duration) {
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
    const res = {
        data: await buildEmbedsLottery(newLottery),
        message: "Lottery has been created"
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

export async function addPlayerLottery(guildId, userId, userToAdd, lotteryOwner) {
    const res = {
        data: null,
        message: `<@${userToAdd.id}> has been added to ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "your"} Lottery`
    };
    const activeLottery = await getActiveLottery(guildId, lotteryOwner ? lotteryOwner.id : userId);

    if (!isAllowedToUpdate(activeLottery, userId)) {
        throw new Error("you are not allowed to do it");
    }

    if (isPlayerIn(activeLottery, userToAdd.id)) {
        throw new Error("he/she is already in it");
    }

    activeLottery.players.push(userToAdd.id);
    res.data = await buildEmbedsLottery(activeLottery);
    await updateActiveLottery(guildId, lotteryOwner ? lotteryOwner.id : userId, activeLottery);
    return res;
}

export async function removePlayerLottery(guildId, userId, userToRemove, lotteryOwner) {
    const res = {
        data: null,
        message: `<@${userToRemove.id}> has been removed from ${lotteryOwner ? `<@${lotteryOwner.id}>'s` : "your"} Lottery`
    };
    const activeLottery = await getActiveLottery(guildId, lotteryOwner ? lotteryOwner.id : userId);

    if (!isAllowedToUpdate(activeLottery, userId)) {
        throw new Error("you are not allowed to do it");
    }

    if (!isPlayerIn(activeLottery, userToRemove.id)) {
        throw new Error("he/she is not in it");
    }

    activeLottery.players = activeLottery.players.filter((e) => e !== userToRemove.id);
    res.data = await buildEmbedsLottery(activeLottery);
    await updateActiveLottery(guildId, lotteryOwner ? lotteryOwner.id : userId, activeLottery);
    return res;
}

export async function showLottery(guildId, userId, lotteryOwner) {
    const res = { data: null, message: "" };
    const activeLottery = await getActiveLottery(guildId, lotteryOwner ? lotteryOwner.id : userId);
    res.data = await buildEmbedsLottery(activeLottery);
    return res;
}

export async function allowPlayerLottery(guildId, userId, userToAllow) {
    const res = {
        data: null,
        message: `<@${userToAllow.id}> has been allowed to udate your Lottery`
    };

    if (userId === userToAllow.id) {
        res.message = "You are the owner...";
        return res;
    }

    const activeLottery = await getActiveLottery(guildId, userId);

    if (isAllowedToUpdate(activeLottery, userToAllow.id)) {
        throw new Error("he/she is already allowed to update your Lottery");
    }

    activeLottery.allowedUsers.push(userToAllow.id);
    await updateActiveLottery(guildId, userId, activeLottery);
    return res;
}

export async function disallowPlayerLottery(guildId, userId, userToDisallow) {
    const res = {
        data: null,
        message: `<@${userToDisallow.id}> has been disallowed to udate your Lottery`
    };

    if (userId === userToDisallow.id) {
        res.message = "You are the owner...";
        return res;
    }

    const activeLottery = await getActiveLottery(guildId, userId);

    if (!isAllowedIn(activeLottery, userToDisallow.id)) {
        throw new Error("he/she is not even allowed to update your Lottery");
    }

    activeLottery.allowedUsers = activeLottery.allowedUsers.filter((e) => e !== userToDisallow.id);
    await updateActiveLottery(guildId, userId, activeLottery);
    return res;
}

export async function closeLottery(guildId, userId, podiumSize, taxPercent) {
    const res = { data: null, message: "" };
    const activeLottery = await getActiveLottery(guildId, userId);
    const { podium, amountTax, message } = handleWinnersLottery(activeLottery, podiumSize, taxPercent);

    activeLottery.active = false;
    res.data = await buildEmbedsWinnersLottery(activeLottery, podium, amountTax);
    res.message = message;
    await updateActiveLottery(guildId, userId, activeLottery);
    return res;
}