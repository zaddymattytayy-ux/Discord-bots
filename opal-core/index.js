const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { connectDB, sql } = require('./src/database/sql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});
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
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
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
        return;
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'register_modal') {
            const username = interaction.fields.getTextInputValue('username');
            const password = interaction.fields.getTextInputValue('password');
            const email = interaction.fields.getTextInputValue('email');

            // Validate username (4-10 alphanumeric characters)
            if (!/^[a-zA-Z0-9]{4,10}$/.test(username)) {
                return interaction.reply({
                    content: '❌ Username must be 4–10 alphanumeric characters only.',
                    ephemeral: true
                });
            }

            // Validate password (4-10 alphanumeric characters)
            if (!/^[a-zA-Z0-9]{4,10}$/.test(password)) {
                return interaction.reply({
                    content: '❌ Password must be 4–10 alphanumeric characters only.',
                    ephemeral: true
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return interaction.reply({
                    content: '❌ Please enter a valid email address.',
                    ephemeral: true
                });
            }

            if (email.length > 50) {
                return interaction.reply({
                    content: '❌ Email address is too long (max 50 characters).',
                    ephemeral: true
                });
            }

            try {
                // Check if username already exists
                const usernameCheck = await sql.query`SELECT memb___id FROM MEMB_INFO WHERE memb___id = ${username}`;
                if (usernameCheck.recordset.length > 0) {
                    return interaction.reply({
                        content: '❌ Username is already taken. Please choose a different one.',
                        ephemeral: true
                    });
                }

                // Check if email already exists
                const emailCheck = await sql.query`SELECT memb___id FROM MEMB_INFO WHERE mail_addr = ${email}`;
                if (emailCheck.recordset.length > 0) {
                    return interaction.reply({
                        content: '❌ This email is already registered to another account.',
                        ephemeral: true
                    });
                }

                // Insert new account into MEMB_INFO (Louis S6 Emulator structure)
                await sql.query`
                    INSERT INTO MEMB_INFO
                    (memb___id, memb__pwd, memb_name, sno__numb, mail_addr, bloc_code, ctl1_code)
                    VALUES (${username}, ${password}, 'DiscordUser', '1111111111111', ${email}, 0, 0)
                `;

                await interaction.reply({
                    content: `✅ Account **${username}** has been created successfully!\n📧 Registered email: ||${email}||`,
                    ephemeral: true
                });
            } catch (err) {
                console.error('Registration Error:', err);
                await interaction.reply({
                    content: '❌ Database error occurred. Please try again later or contact an administrator.',
                    ephemeral: true
                });
            }
        }
    }
});

client.once('ready', () => {
    console.log(`🤖 OPAL-CORE Online: ${client.user.tag}`);
    connectDB();
});

client.login(process.env.DISCORD_TOKEN);
