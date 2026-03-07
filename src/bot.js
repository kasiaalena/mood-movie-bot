require('dotenv').config();

const { Telegraf, Scenes, session, Markup } = require('telegraf');
const { movieWizard, showMovie } = require('./scenes/movieWizard');
const { t } = require('./utils/i18n');

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([movieWizard]);

bot.use(session());
bot.use(stage.middleware());

// /start — welcome screen
bot.start(async (ctx) => {
  const lang = ctx.session?.lang;
  ctx.session = {};
  if (lang) ctx.session.lang = lang;
  await ctx.reply(t(ctx, 'welcome'), {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback(t(ctx, 'find_movie_btn'), 'find_movie')],
    ]),
  });
});

// /language — show language picker
bot.command('language', async (ctx) => {
  await ctx.reply(t(ctx, 'language_pick'), {
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🇷🇺 Русский', 'lang_ru'),
        Markup.button.callback('🇬🇧 English', 'lang_en'),
      ],
    ]),
  });
});

bot.action('lang_ru', async (ctx) => {
  ctx.session.lang = 'ru';
  await ctx.answerCbQuery();
  await ctx.editMessageText(t(ctx, 'language_set'));
});

bot.action('lang_en', async (ctx) => {
  ctx.session.lang = 'en';
  await ctx.answerCbQuery();
  await ctx.editMessageText(t(ctx, 'language_set'));
});

// "Find me a movie" button
bot.action('find_movie', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('movie-wizard');
});

// "New search" button — restart wizard
bot.action('new_search', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.movies = null;
  return ctx.scene.enter('movie-wizard');
});

// "Already watched — next one" button
bot.action(/^next_movie_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const index = parseInt(ctx.match[1]);
  const movies = ctx.session?.movies;
  await showMovie(ctx, movies, index);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch().then(() => {
  console.log('Bot is running...');
});
