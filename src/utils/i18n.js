const ru = require('../locales/ru.json');
const en = require('../locales/en.json');

const locales = { ru, en };

function getLang(ctx) {
  if (ctx.session?.lang) return ctx.session.lang;
  const code = ctx.from?.language_code || 'en';
  return code.startsWith('ru') ? 'ru' : 'en';
}

function t(ctx, key, vars = {}) {
  const lang = getLang(ctx);
  const locale = locales[lang] || locales.en;
  let text = locale[key] || en[key] || key;

  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }

  return text;
}

module.exports = { t, getLang };
