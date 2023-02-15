import { DeleteCommand } from "./commands/delete/index.js";

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
DeleteCommand(process.env.APP_ID, process.env.GUILD_ID, commandId);