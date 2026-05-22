-- Entry-page (landing, ym:s:startURL) behaviour: visits + bounce rate per page. Kept separate from
-- the other breakdowns (distinct aggregation — summing would double-count visits). Missing pages are
-- normalised to '(none)'. History accumulates per day via the date column.
CREATE TABLE page_stats (
  date TEXT NOT NULL,
  page TEXT NOT NULL,
  visits INTEGER NOT NULL,
  users INTEGER NOT NULL,
  bounce_rate REAL NOT NULL,
  goal_reaches INTEGER NOT NULL,
  conversion_rate REAL NOT NULL,
  PRIMARY KEY (date, page)
);
