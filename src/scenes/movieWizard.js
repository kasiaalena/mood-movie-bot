const { Scenes, Markup } = require('telegraf');
const { t, getLang } = require('../utils/i18n');
const { mapMoodToParams } = require('../utils/moodMapper');
const { fetchMovies, formatMovieCard } = require('../services/tmdb');

function scaleKeyboard(step) {
  return Markup.inlineKeyboard([
    [1, 2, 3, 4, 5].map(n => Markup.button.callback(String(n), `step${step}_${n}`)),
  ]);
}

function contentTypeKeyboard(ctx) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t(ctx, 'type_movie_btn'), 'type_movie'),
      Markup.button.callback(t(ctx, 'type_tv_btn'), 'type_tv'),
      Markup.button.callback(t(ctx, 'type_animation_btn'), 'type_animation'),
    ],
  ]);
}

async function showMovie(ctx, movies, index) {
  const lang = getLang(ctx);

  if (!movies || movies.length === 0) {
    await ctx.reply(t(ctx, 'no_movies'));
    return;
  }

  if (index >= movies.length) {
    await ctx.reply(t(ctx, 'no_more_movies'));
    return;
  }

  const movie = movies[index];
  const { title, year, rating, genres, overview, link } = formatMovieCard(movie, lang);

  const text = t(ctx, 'movie_card', { title, year, rating, genres, overview, link });
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(t(ctx, 'already_watched_btn'), `next_movie_${index + 1}`)],
    [Markup.button.callback(t(ctx, 'new_search_btn'), 'new_search')],
  ]);

  await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
}

const CONTENT_TYPES = ['type_movie', 'type_tv', 'type_animation'];

const movieWizard = new Scenes.WizardScene(
  'movie-wizard',

  // Step 0: Ask content type
  async (ctx) => {
    await ctx.reply(t(ctx, 'q0'), { parse_mode: 'HTML', ...contentTypeKeyboard(ctx) });
    return ctx.wizard.next();
  },

  // Step 1: Save content type, ask Q1
  async (ctx) => {
    if (!CONTENT_TYPES.includes(ctx.callbackQuery?.data)) return;
    ctx.wizard.state.contentType = ctx.callbackQuery.data.replace('type_', '');
    await ctx.answerCbQuery();
    await ctx.editMessageText(t(ctx, 'q1'), { parse_mode: 'HTML', ...scaleKeyboard(1) });
    return ctx.wizard.next();
  },

  // Step 2: Save Q1, ask Q2
  async (ctx) => {
    if (!ctx.callbackQuery?.data?.startsWith('step1_')) return;
    ctx.wizard.state.q1 = parseInt(ctx.callbackQuery.data.split('_')[1]);
    await ctx.answerCbQuery();
    await ctx.editMessageText(t(ctx, 'q2'), { parse_mode: 'HTML', ...scaleKeyboard(2) });
    return ctx.wizard.next();
  },

  // Step 3: Save Q2, ask Q3
  async (ctx) => {
    if (!ctx.callbackQuery?.data?.startsWith('step2_')) return;
    ctx.wizard.state.q2 = parseInt(ctx.callbackQuery.data.split('_')[1]);
    await ctx.answerCbQuery();
    await ctx.editMessageText(t(ctx, 'q3'), { parse_mode: 'HTML', ...scaleKeyboard(3) });
    return ctx.wizard.next();
  },

  // Step 4: Save Q3, fetch and show result
  async (ctx) => {
    if (!ctx.callbackQuery?.data?.startsWith('step3_')) return;
    ctx.wizard.state.q3 = parseInt(ctx.callbackQuery.data.split('_')[1]);
    await ctx.answerCbQuery();
    await ctx.editMessageText(t(ctx, 'searching'));

    const { q1, q2, q3, contentType } = ctx.wizard.state;
    const params = mapMoodToParams(q1, q2, q3);
    const lang = getLang(ctx);

    try {
      const movies = await fetchMovies(params, lang, contentType);
      ctx.session.movies = movies;

      await showMovie(ctx, movies, 0);
    } catch (err) {
      console.error('TMDB fetch error:', err.message);
      await ctx.reply(t(ctx, 'error'));
    }

    return ctx.scene.leave();
  }
);

module.exports = { movieWizard, showMovie };
