// TMDB genre IDs
const GENRES = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HORROR: 27,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIFI: 878,
  THRILLER: 53,
  WAR: 10752,
};

/**
 * Maps mood scores to TMDB query parameters.
 * @param {number} q1 - 1=relax, 5=think
 * @param {number} q2 - 1=feel/cry, 5=laugh
 * @param {number} q3 - 1=classic, 5=new
 */
function mapMoodToParams(q1, q2, q3) {
  const think = q1;
  const relax = 6 - q1;
  const laugh = q2;
  const feel = 6 - q2;

  const scores = {};

  const add = (id, score) => {
    scores[id] = (scores[id] || 0) + score;
  };

  // Q1: think vs relax
  add(GENRES.SCIFI, think * 1.5);
  add(GENRES.MYSTERY, think * 1.3);
  add(GENRES.THRILLER, think * 1.2);
  add(GENRES.CRIME, think * 0.9);
  add(GENRES.COMEDY, relax * 1.5);
  add(GENRES.FAMILY, relax * 0.9);
  add(GENRES.ADVENTURE, relax * 0.7);

  // Q2: laugh vs feel
  add(GENRES.COMEDY, laugh * 1.5);
  add(GENRES.ADVENTURE, laugh * 0.7);
  add(GENRES.ACTION, laugh * 0.5);
  add(GENRES.DRAMA, feel * 1.3);
  add(GENRES.ROMANCE, feel * 1.1);
  add(GENRES.HORROR, feel * 0.8);
  add(GENRES.WAR, feel * 0.6);
  add(GENRES.THRILLER, feel * 0.5);

  const topGenres = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([id]) => id);

  const yearParams = {};
  if (q3 <= 2) {
    yearParams['primary_release_date.lte'] = '1999-12-31';
  } else if (q3 >= 4) {
    yearParams['primary_release_date.gte'] = '2010-01-01';
  }

  return { genres: topGenres, yearParams };
}

module.exports = { mapMoodToParams };
