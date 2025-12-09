const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { sql } = require('../database/sql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('opal')
        .setDescription('OpalMU Account Management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('register')
                .setDescription('Create a new game account'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all registered accounts (Admin only)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('createguild')
                .setDescription('Create a new guild (Admin only)')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'register') {
            // Show modal for registration
            const modal = new ModalBuilder()
                .setCustomId('register_modal')
                .setTitle('🎮 OpalMU Account Registration');

            const usernameInput = new TextInputBuilder()
                .setCustomId('username')
                .setLabel('Username (4-10 alphanumeric characters)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(4)
                .setMaxLength(10)
                .setRequired(true)
                .setPlaceholder('Enter your desired username');

            const passwordInput = new TextInputBuilder()
                .setCustomId('password')
                .setLabel('Password (4-10 alphanumeric characters)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(4)
                .setMaxLength(10)
                .setRequired(true)
                .setPlaceholder('Enter your password');

            const emailInput = new TextInputBuilder()
                .setCustomId('email')
                .setLabel('Email Address')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(50)
                .setRequired(true)
                .setPlaceholder('Enter your email address');

            const row1 = new ActionRowBuilder().addComponents(usernameInput);
            const row2 = new ActionRowBuilder().addComponents(passwordInput);
            const row3 = new ActionRowBuilder().addComponents(emailInput);

            modal.addComponents(row1, row2, row3);
            await interaction.showModal(modal);

        } else if (subcommand === 'list') {
            // Check for admin permissions or specific role
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            const hasOpalRole = interaction.member.roles.cache.some(role =>
                role.name.toLowerCase() === 'opal admin' || role.name.toLowerCase() === 'opaladmin'
            );

            if (!isAdmin && !hasOpalRole) {
                return interaction.reply({
                    content: '❌ Sorry, you cannot use this command. Admin or Opal Admin role required.',
                    ephemeral: true
                });
            }

            try {
                await interaction.deferReply({ ephemeral: true });

                const result = await sql.query`SELECT memb___id, mail_addr FROM MEMB_INFO ORDER BY memb___id`;

                if (result.recordset.length === 0) {
                    return interaction.editReply({
                        content: '📋 No registered accounts found.'
                    });
                }

                // Format the list
                const accountList = result.recordset.map((acc, index) =>
                    `**${index + 1}.** \`${acc.memb___id}\` - ${acc.mail_addr || 'No email'}`
                );

                // Discord has a 2000 character limit, so we may need to chunk
                const chunks = [];
                let currentChunk = '📋 **Registered Accounts:**\n\n';

                for (const account of accountList) {
                    if (currentChunk.length + account.length + 1 > 1900) {
                        chunks.push(currentChunk);
                        currentChunk = '';
                    }
                    currentChunk += account + '\n';
                }
                if (currentChunk) chunks.push(currentChunk);

                // Send first chunk as reply
                await interaction.editReply({
                    content: chunks[0] + `\n\n**Total: ${result.recordset.length} accounts**`
                });

                // Send additional chunks as follow-ups if needed
                for (let i = 1; i < chunks.length; i++) {
                    await interaction.followUp({ content: chunks[i], ephemeral: true });
                }

            } catch (err) {
                console.error('List Error:', err);
                await interaction.editReply({
                    content: '❌ Database error occurred while fetching accounts.'
                });
            }
        } else if (subcommand === 'createguild') {
            // Check for admin permissions or specific role
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            const hasOpalRole = interaction.member.roles.cache.some(role =>
                role.name.toLowerCase() === 'opal admin' || role.name.toLowerCase() === 'opaladmin'
            );

            if (!isAdmin && !hasOpalRole) {
                return interaction.reply({
                    content: '❌ Sorry, you cannot use this command. Admin or Opal Admin role required.',
                    ephemeral: true
                });
            }

            // Show modal for guild creation
            const modal = new ModalBuilder()
                .setCustomId('createguild_modal')
                .setTitle('⚔️ Create New Guild');

            const guildNameInput = new TextInputBuilder()
                .setCustomId('guildname')
                .setLabel('Guild Name (max 8 characters)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(8)
                .setRequired(true)
                .setPlaceholder('Enter guild name');

            const guildMasterInput = new TextInputBuilder()
                .setCustomId('guildmaster')
                .setLabel('Guild Master Account Name')
                .setStyle(TextInputStyle.Short)
                .setMinLength(4)
                .setMaxLength(10)
                .setRequired(true)
                .setPlaceholder('Enter the account name of guild master');

            const guildNoticeInput = new TextInputBuilder()
                .setCustomId('guildnotice')
                .setLabel('Guild Notice/Description (optional)')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(60)
                .setRequired(false)
                .setPlaceholder('Enter guild notice or leave blank');

            const row1 = new ActionRowBuilder().addComponents(guildNameInput);
            const row2 = new ActionRowBuilder().addComponents(guildMasterInput);
            const row3 = new ActionRowBuilder().addComponents(guildNoticeInput);

            modal.addComponents(row1, row2, row3);
            await interaction.showModal(modal);
        }
    },
};
