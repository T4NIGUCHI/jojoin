const { Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

// Discord Botの設定
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bosyu') {
        // モーダルを作成
        const modal = new ModalBuilder()
            .setCustomId('bosyuModal')
            .setTitle('募集の詳細入力');

        // 募集するゲームの入力
        const gameInput = new TextInputBuilder()
            .setCustomId('gameInput')
            .setLabel('募集するゲーム')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('例: Apex Legends')
            .setRequired(true);

        // 募集人数の入力
        const memberInput = new TextInputBuilder()
            .setCustomId('memberInput')
            .setLabel('募集人数')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('例: 3')
            .setRequired(true);

        // 雰囲気の入力
        const moodInput = new TextInputBuilder()
            .setCustomId('moodInput')
            .setLabel('雰囲気')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('例: 和気あいあい')
            .setRequired(false);

        // 開始時間の入力
        const startTimeInput = new TextInputBuilder()
            .setCustomId('startTimeInput')
            .setLabel('開始時間')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('例: 20:00')
            .setRequired(true);

        // 期間の入力
        const durationInput = new TextInputBuilder()
            .setCustomId('durationInput')
            .setLabel('期間')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('例: 2時間')
            .setRequired(false);

        // アクション行を追加
        const actionRow1 = new ActionRowBuilder().addComponents(gameInput);
        const actionRow2 = new ActionRowBuilder().addComponents(memberInput);
        const actionRow3 = new ActionRowBuilder().addComponents(moodInput);
        const actionRow4 = new ActionRowBuilder().addComponents(startTimeInput);
        const actionRow5 = new ActionRowBuilder().addComponents(durationInput);

        modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4, actionRow5);

        // モーダルを表示
        await interaction.showModal(modal);
    }
});

// モーダルの送信データを取得
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'bosyuModal') {
        const game = interaction.fields.getTextInputValue('gameInput');
        const members = interaction.fields.getTextInputValue('memberInput');
        const mood = interaction.fields.getTextInputValue('moodInput');
        const startTime = interaction.fields.getTextInputValue('startTimeInput');
        const duration = interaction.fields.getTextInputValue('durationInput');

        await interaction.reply({
            content: `募集が作成されました！\n**ゲーム**: ${game}\n**人数**: ${members}\n**雰囲気**: ${mood}\n**開始時間**: ${startTime}\n**期間**: ${duration}`,
            ephemeral: true,
        });
    }
});

// Discord Botログイン
client.login('YOUR_BOT_TOKEN');
