const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { connectDB } = require('./src/database/sql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({ intents: [] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Refreshing Slash Commands...');
        await rest.put(
            Routes.applicationCommands('1447940553529622578'), // Replace with your Discord Application ID
            { body: commands },
        );
        console.log('✅ Slash Commands Registered.');
    } catch (error) {
        console.error('❌ Failed to register slash commands:', error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error executing ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Error executing command.', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Error executing command.', ephemeral: true });
        }
    }
});

client.once('ready', () => {
    console.log(`🤖 OPAL-CORE Online: ${client.user.tag}`);
    connectDB();
});

client.login(process.env.DISCORD_TOKEN);
