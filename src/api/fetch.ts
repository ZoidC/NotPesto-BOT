import { DISCORD_TOKEN } from "../constants/env-constants.js";

export async function DiscordRequest(endpoint: string, options: any) {
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
    console.log("status :", res.status);
    console.log(jsonRes);
    throw new Error(jsonRes.message);
  }

  return jsonRes;
}
