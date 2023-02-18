/**
 * The purpose of this script is to notify the Discord server.
 * (Not delete the local command file)
 */

import { deleteGuildSlashCommandById, deleteGuildSlashCommands } from "./src/api/command-api.js";

// Check to see if the --id argument is present
const indexAll = process.argv.indexOf('--all');
const isFlagAll = indexAll > -1;

const indexId = process.argv.indexOf('--id');
const isFlagId = indexId > -1;
const isFlagIdAndValue = isFlagId && process.argv.length > indexId + 1;

if (!isFlagAll && !isFlagId) {
    console.log('Missing flag --all or --id');
    process.exit();
}

if (isFlagAll) {
    await deleteGuildSlashCommands();
    process.exit();
}

if (!isFlagIdAndValue) {
    console.log('Missing <id> behind the flag --id');
    process.exit();
}

const commandId = process.argv[indexId + 1];
await deleteGuildSlashCommandById(commandId);