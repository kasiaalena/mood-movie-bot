// Per-user limit on movie searches: each search is a TMDB request,
// so one user flooding the bot would burn the shared TMDB quota.
const MAX_SEARCHES = 10;
const WINDOW_MS = 5 * 60 * 1000;

const searches = new Map(); // userId -> timestamps of recent searches

function recent(userId, now) {
  const list = (searches.get(userId) || []).filter(ts => now - ts < WINDOW_MS);
  if (list.length) searches.set(userId, list);
  else searches.delete(userId);
  return list;
}

// Milliseconds until the user may search again; 0 if allowed now.
function waitMs(userId, now = Date.now()) {
  const list = recent(userId, now);
  if (list.length < MAX_SEARCHES) return 0;
  return WINDOW_MS - (now - list[0]);
}

function recordSearch(userId, now = Date.now()) {
  const list = recent(userId, now);
  list.push(now);
  searches.set(userId, list);
}

// Drop users with no recent searches so the map does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const userId of searches.keys()) recent(userId, now);
}, WINDOW_MS).unref();

module.exports = { waitMs, recordSearch, MAX_SEARCHES, WINDOW_MS };
