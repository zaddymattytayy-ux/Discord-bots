const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🔄 Refreshing ${commands.length} slash commands...`);

        // Deploy to a specific guild (faster for testing)
        // await rest.put(
        //     Routes.applicationGuildCommands(config.clientId, config.guildId),
        //     { body: commands },
        // );

        // Deploy globally (takes up to 1 hour to propagate)
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log(`✅ Successfully registered ${commands.length} slash commands.`);
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
})();
