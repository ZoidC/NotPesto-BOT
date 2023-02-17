export function getXRandomItemsFromArray(array, nbItems) {
    const maxItem = Math.min(array.length, nbItems);
    const randomItems = [];

    for (let i = 0; i < maxItem; i++) {
        const randomIndex = Math.floor(Math.random() * array.length);
        const extractedItem = array.splice(randomIndex, 1);
        randomItems.push(extractedItem[0]);
    }

    return randomItems;
}