const { SlashCommandBuilder } = require('discord.js');
const { sql } = require('../database/sql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buyvip')
        .setDescription('Buy 30 Days VIP (Cost: 500 Credits)')
        .addStringOption(option => option.setName('account').setDescription('Your Account Name').setRequired(true)),
    async execute(interaction) {
        const account = interaction.options.getString('account');

        try {
            const pool = await sql.connect();

            const result = await pool.request()
                .input('acc', sql.VarChar, account)
                .query('SELECT credits FROM MEMB_INFO WHERE memb___id = @acc');

            if (result.recordset.length === 0) return interaction.reply({ content: '❌ Account not found.', ephemeral: true });
            if (result.recordset[0].credits < 500) return interaction.reply({ content: '❌ Insufficient Credits.', ephemeral: true });

            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            const request = new sql.Request(transaction);

            // Use parameterized queries to prevent SQL injection
            await request
                .input('acc1', sql.VarChar, account)
                .query('UPDATE MEMB_INFO SET credits = credits - 500 WHERE memb___id = @acc1');

            const request2 = new sql.Request(transaction);
            await request2
                .input('acc2', sql.VarChar, account)
                .query('UPDATE MEMB_INFO SET AccountLevel = 1, VIP_Expire = DATEADD(day, 30, GETDATE()) WHERE memb___id = @acc2');

            await transaction.commit();
            await interaction.reply({ content: `🎉 **${account}** is now VIP!`, ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: '❌ Transaction Failed.', ephemeral: true });
        }
    },
};
