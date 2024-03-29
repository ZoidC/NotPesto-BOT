import { DISCORD_TOKEN } from "../constants/env-constants.js";

export async function discordRequest(endpoint: RequestInfo, options: RequestInit) {
	let res;
	const url = endpoint;
	if (options.body) options.body = JSON.stringify(options.body);

	try {
		res = await fetch(url, {
			headers: {
				Authorization: `Bot ${DISCORD_TOKEN}`,
				"Content-Type": "application/json; charset=UTF-8",
			},
			...options,
		});
	} catch (e) {
		throw new Error("Could not fetch Discord API");
	}

	const jsonRes = res.status != 204 ? await res.json() : null;

	if (!res.ok) {
		console.error("status :", res.status);
		console.error(jsonRes);
		throw new Error(jsonRes.message);
	}

	return jsonRes;
}
