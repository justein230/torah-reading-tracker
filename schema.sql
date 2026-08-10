CREATE TABLE IF NOT EXISTS sefarim (
  id         INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL UNIQUE,
  name_en    TEXT    NOT NULL,
  color      TEXT    NOT NULL,           -- Okabe-Ito hex color for UI
  sort_order INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS parshiot (
  id         INTEGER PRIMARY KEY,
  sefer_id   INTEGER NOT NULL REFERENCES sefarim(id),
  name       TEXT    NOT NULL UNIQUE,
  name_en    TEXT    NOT NULL,
  sort_order INTEGER NOT NULL
  chapter_start INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  chapter_end INTEGER NOT NULL,
  verse_end INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS aliyot (
  id                   INTEGER PRIMARY KEY,
  parsha_id            INTEGER NOT NULL REFERENCES parshiot(id),
  aliyah               INTEGER NOT NULL CHECK(aliyah BETWEEN 1 AND 7),
  double_parsha        TEXT,
  double_parsha_aliyah INTEGER,
  pseukim              INTEGER NOT NULL CHECK(pseukim > 0),
  chapter_start INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  chapter_end INTEGER NOT NULL,
  verse_end INTEGER NOT NULL,
  UNIQUE(parsha_id, aliyah)
);

CREATE TABLE IF NOT EXISTS readings (
  id           INTEGER PRIMARY KEY,
  aliyah_id    INTEGER NOT NULL REFERENCES aliyot(id) ON DELETE CASCADE,
  date_read    TEXT    NOT NULL,
  occasion     TEXT,
  location     TEXT,
  reading_type TEXT    NOT NULL DEFAULT 'original'
                       CHECK(reading_type IN ('original', 'additional')),
  created_at   TEXT    NOT NULL DEFAULT (date('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_readings_aliyah_date ON readings(aliyah_id, date_read);
CREATE INDEX        IF NOT EXISTS idx_readings_aliyah      ON readings(aliyah_id);
CREATE INDEX        IF NOT EXISTS idx_readings_date        ON readings(date_read);

-- Full aliyah context with sefer/parsha names and Torah percentage
CREATE VIEW IF NOT EXISTS v_aliyot AS
SELECT
    a.id                                AS aliyah_id,
    s.id                                AS sefer_id,
    s.name                              AS sefer,
    s.name_en                           AS sefer_en,
    s.color                             AS sefer_color,
    s.sort_order                        AS sefer_order,
    p.id                                AS parsha_id,
    p.name                              AS parsha,
    p.name_en                           AS parsha_en,
    p.chapter_start                     AS parsha_chapter_start,
    p.verse_start                       AS parsha_verse_start,
    p.chapter_end                       AS parsha_chapter_end,
    p.verse_end                         AS parsha_verse_end,
    p.sort_order                        AS parsha_order,
    a.aliyah,
    COALESCE(a.double_parsha, '')       AS double_parsha,
    a.double_parsha_aliyah,
    a.chapter_start                     AS aliyah_chapter_start,
    a.verse_start                       AS aliyah_verse_start
    a.chapter_end                       AS aliyah_chapter_end
    a.verse_end                         AS aliyah_verse_end
    a.pseukim,
    ROUND(CAST(a.pseukim AS REAL) /
          (SELECT SUM(pseukim) FROM aliyot) * 100, 6) AS pct
FROM aliyot a
JOIN parshiot p ON p.id = a.parsha_id
JOIN sefarim  s ON s.id = p.sefer_id;

-- Every reading with its full aliyah/parsha/sefer context
CREATE VIEW IF NOT EXISTS v_readings AS
SELECT
    r.id                                AS reading_id,
    r.date_read,
    r.reading_type,
    r.occasion,
    r.location,
    r.created_at,
    a.aliyah_id,
    a.sefer,
    a.sefer_en,
    a.sefer_color,
    a.parsha,
    a.parsha_en,
    a.aliyah,
    a.double_parsha,
    a.pseukim,
    a.chapter_start,
    a.verse_start,
    a.chapter_end,
    a.verse_end,
    a.pct
FROM readings r
JOIN v_aliyot a ON a.aliyah_id = r.aliyah_id;

-- Migration tracking (applied automatically from migrations/*.sql on startup)
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   TEXT NOT NULL PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
