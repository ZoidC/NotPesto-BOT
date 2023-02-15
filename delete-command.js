/**
 * The purpose of this script is to notify the Discord server.
 * (Not delete the local command file)
 */

import { deleteGuildSlashCommand } from "./src/api/discord-api.js";

// Check to see if the -f argument is present
const indexId = process.argv.indexOf('--id');
const isFlag = indexId > -1;
const isFlagAndValue = isFlag && process.argv.length > indexId + 1;

if (!isFlag) {
    console.log('Missing flag --id');
    process.exit();
}
if (!isFlagAndValue) {
    console.log('Missing <id> behind the flag --id');
    process.exit();
}

const commandId = process.argv[indexId + 1];
await deleteGuildSlashCommand(commandId);