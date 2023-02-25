export function getXRandomItemsFromArray<T>(array: T[], nbItems: number) {
	const workingArray = [...array];
	const maxItem = Math.min(workingArray.length, nbItems);
	const randomItems = [];

	for (let i = 0; i < maxItem; i++) {
		const randomIndex = Math.floor(Math.random() * workingArray.length);
		const extractedItem = workingArray.splice(randomIndex, 1);
		randomItems.push(extractedItem[0]);
	}

	return randomItems;
}
