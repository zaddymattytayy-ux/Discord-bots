const { SlashCommandBuilder } = require('discord.js');
const { sql } = require('../database/sql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Create a Game Account')
        .addStringOption(option => option.setName('user').setDescription('Username').setRequired(true))
        .addStringOption(option => option.setName('pass').setDescription('Password').setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getString('user');
        const pass = interaction.options.getString('pass');

        if (!/^[a-zA-Z0-9]{4,10}$/.test(user)) {
            return interaction.reply({ content: 'User/Pass must be 4–10 alphanumeric characters.', ephemeral: true });
        }

        try {
            const check = await sql.query`SELECT memb___id FROM MEMB_INFO WHERE memb___id = ${user}`;
            if (check.recordset.length > 0)
                return interaction.reply({ content: '❌ Username taken.', ephemeral: true });

            await sql.query`
                INSERT INTO MEMB_INFO
                (memb___id, memb__pwd, memb_name, sno__numb, bloc_code, ctl1_code)
                VALUES (${user}, ${pass}, 'DiscordUser', '1111111111111', 0, 0)
            `;

            await interaction.reply({ content: `✅ Account **${user}** Created!`, ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Database Error.', ephemeral: true });
        }
    },
};
