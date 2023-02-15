# Not Pesto
Doc : https://discordjs.guide/

## How to add the BOT to a Discord
- Generate an url with specific permission here : https://discord.com/developers/applications (OAuth2 / URL Generator)
- Visit the generated URL 
> e.g. https://discord.com/api/oauth2/authorize?client_id=1075144443855913042&permissions=2048&scope=bot%20applications.commands

## To do if multiple servers
Update code to Global Slash Command : https://discordjs.guide/creating-your-bot/command-deployment.html#global-commands

## How to start the BOT
- `npm install`
- `npm start`

## How to delete a BOT command in Discord
- `node delete-command --id <command_id>`