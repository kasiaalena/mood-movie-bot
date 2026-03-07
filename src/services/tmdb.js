const axios = require('axios');

const BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const GENRE_NAMES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western',
  // TV-specific genres
  10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy', 10768: 'War & Politics',
};

const GENRE_NAMES_RU = {
  28: 'Экшен', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия',
  80: 'Криминал', 99: 'Документальный', 18: 'Драма', 10751: 'Семейный',
  14: 'Фэнтези', 36: 'История', 27: 'Ужасы', 10402: 'Музыка',
  9648: 'Детектив', 10749: 'Мелодрама', 878: 'Фантастика', 53: 'Триллер',
  10752: 'Военный', 37: 'Вестерн',
  // TV-specific genres
  10759: 'Боевик & Приключения', 10765: 'Фантастика & Фэнтези', 10768: 'Война & Политика',
};

// Movie genre IDs → closest TV genre IDs (TMDB has separate taxonomies)
const MOVIE_TO_TV_GENRE = {
  28: 10759,    // Action → Action & Adventure
  12: 10759,    // Adventure → Action & Adventure
  878: 10765,   // Sci-Fi → Sci-Fi & Fantasy
  14: 10765,    // Fantasy → Sci-Fi & Fantasy
  10752: 10768, // War → War & Politics
  53: 80,       // Thriller → Crime
  27: 9648,     // Horror → Mystery
  10749: 18,    // Romance → Drama
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function fetchMovies({ genres, yearParams }, lang = 'en', contentType = 'movie') {
  const tmdbLang = lang.startsWith('ru') ? 'ru-RU' : 'en-US';
  const isTV = contentType === 'tv';
  const isAnimation = contentType === 'animation';

  const dateKey = isTV ? 'first_air_date' : 'primary_release_date';
  const yearParamsMapped = {};
  for (const [k, v] of Object.entries(yearParams)) {
    yearParamsMapped[k.replace('primary_release_date', dateKey)] = v;
  }

  const params = {
    api_key: process.env.TMDB_API_KEY,
    language: tmdbLang,
    'vote_count.gte': 200,
    'vote_average.gte': 6.5,
    sort_by: 'popularity.desc',
    page: 1,
    ...yearParamsMapped,
  };

  if (isAnimation) {
    params.with_genres = '16';
  } else {
    const mappedGenres = isTV
      ? [...new Set(genres.map(id => MOVIE_TO_TV_GENRE[id] || id))]
      : genres;
    params.with_genres = mappedGenres.join(',');
    params.without_genres = '16';
  }

  const endpoint = isTV ? '/discover/tv' : '/discover/movie';
  const response = await axios.get(`${BASE_URL}${endpoint}`, { params });
  return response.data.results || [];
}

function formatMovieCard(movie, lang = 'en') {
  const isRu = lang.startsWith('ru');
  const genreMap = isRu ? GENRE_NAMES_RU : GENRE_NAMES;

  const title = escapeHtml(movie.title || movie.name || movie.original_title || movie.original_name);
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4) || '?';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const genres = escapeHtml(
    (movie.genre_ids || []).map(id => genreMap[id]).filter(Boolean).join(', ') || '—'
  );
  const rawOverview = movie.overview
    ? movie.overview.slice(0, 280) + (movie.overview.length > 280 ? '...' : '')
    : (isRu ? 'Описание недоступно.' : 'No description available.');
  const overview = escapeHtml(rawOverview);
  const isShow = !movie.title && !movie.original_title;
  const link = `https://www.themoviedb.org/${isShow ? 'tv' : 'movie'}/${movie.id}`;

  return { title, year, rating, genres, overview, link };
}

module.exports = { fetchMovies, formatMovieCard, TMDB_IMAGE_BASE };
