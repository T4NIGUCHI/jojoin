// 環境変数を読み込む
require('dotenv').config();

// 必要なモジュールをインポート
const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

// Botのクライアントを作成
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // サーバー情報へのアクセス
        GatewayIntentBits.GuildMessages, // メッセージ情報へのアクセス
        GatewayIntentBits.MessageContent, // メッセージコンテンツへのアクセス
    ],
});

// メンバーリストを追跡するためのマップ（募集ごとに管理）
const recruitments = new Map();

// Botが起動したときの処理
client.once('ready', () => {
    console.log(`${client.user.tag} がオンラインになりました！`);
});

// スラッシュコマンドを登録
const commands = [
    {
        name: 'recruit',
        description: 'Opens a modal to recruit players.',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('スラッシュコマンドを登録中...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('スラッシュコマンドが登録されました！');
    } catch (error) {
        console.error(error);
    }
})();

// スラッシュコマンドの処理
client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand() && interaction.commandName === 'recruit') {
        const modal = new ModalBuilder()
            .setCustomId('recruitModal')
            .setTitle('募集内容を入力してください');

        const gameInput = new TextInputBuilder()
            .setCustomId('game')
            .setLabel('募集内容')
            .setStyle(TextInputStyle.Short);

        const playerInput = new TextInputBuilder()
            .setCustomId('players')
            .setLabel('募集人数')
            .setStyle(TextInputStyle.Short);

        const moodInput = new TextInputBuilder()
            .setCustomId('mood')
            .setLabel('雰囲気 (例: 絶対に勝ちたい！)')
            .setStyle(TextInputStyle.Short);

        const startTimeInput = new TextInputBuilder()
            .setCustomId('startTime')
            .setLabel('開始時間 (例: 18:00)')
            .setStyle(TextInputStyle.Short);

        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('募集終了日時 (空白でも可)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const actionRow1 = new ActionRowBuilder().addComponents(gameInput);
        const actionRow2 = new ActionRowBuilder().addComponents(playerInput);
        const actionRow3 = new ActionRowBuilder().addComponents(moodInput);
        const actionRow4 = new ActionRowBuilder().addComponents(startTimeInput);
        const actionRow5 = new ActionRowBuilder().addComponents(durationInput);

        modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4, actionRow5);

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'recruitModal') {
        const game = interaction.fields.getTextInputValue('game');
        const players = interaction.fields.getTextInputValue('players');
        const mood = interaction.fields.getTextInputValue('mood');
        const startTime = interaction.fields.getTextInputValue('startTime');
        const duration = interaction.fields.getTextInputValue('duration') || '未設定';

        const recruitmentId = `${interaction.channelId}-${Date.now()}`;
        console.log(`Generated recruitment ID: ${recruitmentId}`);

        recruitments.set(recruitmentId, {
            game,
            maxPlayers: parseInt(players, 10),
            mood,
            startTime,
            duration,
            participants: [],
        });

        console.log(`Recruitments Map:`, recruitments);

        const joinButton = new ButtonBuilder()
            .setCustomId(recruitmentId)
            .setLabel('参加する')
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel-${recruitmentId}`)
            .setLabel('キャンセルする')
            .setStyle(ButtonStyle.Danger);

        const buttonRow = new ActionRowBuilder().addComponents(joinButton, cancelButton);

        // @everyone に通知付きで募集内容を投稿
        await interaction.reply({
            content: `@everyone 募集内容:\n` +
                     `募集内容: ${game}\n` +
                     `募集人数: ${players}\n` +
                     `雰囲気: ${mood}\n` +
                     `開始時間: ${startTime}\n` +
                     `募集終了日時: ${duration}\n` +
                     `\n**参加者:** なし`,
            components: [buttonRow],
            allowedMentions: { parse: ['everyone'] }, // @everyone を明示的に許可
        });
    }

    if (interaction.isButton()) {
        let recruitmentId = interaction.customId;

        if (recruitmentId.startsWith('cancel-')) {
            recruitmentId = recruitmentId.replace('cancel-', '');
        }

        const recruitment = recruitments.get(recruitmentId);

        if (!recruitment) {
            await interaction.reply({ content: '募集が見つかりませんでした。', ephemeral: true });
            return;
        }

        // サーバーニックネーム、表示名、全体ユーザー名の順で取得
        const getUserDisplayName = async (userId) => {
            try {
                const member = await interaction.guild.members.fetch(userId);
                return member.nickname || interaction.user.global_name || interaction.user.username;
            } catch (error) {
                return interaction.user.global_name || interaction.user.username;
            }
        };

        if (interaction.customId.startsWith('cancel')) {
            const username = await getUserDisplayName(interaction.user.id);
            recruitment.participants = recruitment.participants.filter(
                (name) => name !== username
            );
        } else {
            if (recruitment.participants.length >= recruitment.maxPlayers) {
                await interaction.reply({ 
                    content: '募集人数が上限に達しています！', 
                    ephemeral: true 
                });
                return;
            }

            const username = await getUserDisplayName(interaction.user.id);
            if (!recruitment.participants.includes(username)) {
                recruitment.participants.push(username);
            }
        }

        const participantList =
            recruitment.participants.length > 0
                ? recruitment.participants.join(', ')
                : 'なし';

        await interaction.update({
            content: `募集内容:\n` +
                     `募集内容: ${recruitment.game}\n` +
                     `募集人数: ${recruitment.maxPlayers}\n` +
                     `雰囲気: ${recruitment.mood}\n` +
                     `開始時間: ${recruitment.startTime}\n` +
                     `募集終了日時: ${recruitment.duration}\n` +
                     `\n**参加者:** ${participantList}`,
        });
    }
});

// BotをDiscordに接続
client.login(process.env.DISCORD_TOKEN);
