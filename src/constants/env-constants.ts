import "dotenv/config";

export const APP_ID = process.env.APP_ID;
export const GUILD_ID = process.env.GUILD_ID;
export const DISCORD_API = process.env.DISCORD_API;
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const MONGODB_URI = process.env.MONGODB_URI;
export const COMMAND_OVERRIDE = process.env.COMMAND_OVERRIDE == "true";
