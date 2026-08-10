export const ALIYOT_SQL = `
  SELECT
    s.name  AS sefer,
    p.name  AS parsha,
    a.aliyah,
    COALESCE(pp.name, '')    AS pair_name,
    COALESCE(pp.name_en, '') AS pair_name_en,
    a.combined_aliyah,
    a.pseukim,
    a.chapter_start,
    a.verse_start,
    a.chapter_end,
    a.verse_end,
    ROUND(CAST(a.pseukim AS REAL) /
          (SELECT SUM(pseukim) FROM aliyot WHERE aliyah != 8) * 100, 6) AS pct,
    COALESCE(
      -- direct standard/double-parsha reading of this aliyah
      (SELECT date_read FROM readings
       WHERE aliyah_id = a.id AND reading_type IN ('standard', 'double_parsha')
       ORDER BY date_read LIMIT 1),
      -- holiday special reading whose verse range fully covers this aliyah
      (SELECT sr.date_read FROM special_readings sr
       JOIN occasion_aliyot oa ON oa.id = sr.occasion_aliyah_id
       WHERE oa.covers_aliyah_id = a.id
       ORDER BY sr.date_read LIMIT 1),
      -- this aliyah is fully contained within another standard aliyah that has been read (e.g., maftir inside aliyah 7)
      (SELECT r.date_read FROM readings r
       JOIN aliyot o ON o.id = r.aliyah_id
       WHERE o.parsha_id = a.parsha_id
         AND o.id != a.id
         AND r.reading_type IN ('standard', 'double_parsha')
         AND (o.chapter_start * 1000 + o.verse_start) <= (a.chapter_start * 1000 + a.verse_start)
         AND (o.chapter_end   * 1000 + o.verse_end)   >= (a.chapter_end   * 1000 + a.verse_end)
       ORDER BY r.date_read LIMIT 1),
      -- holiday sub-aliyot together fully cover this standard aliyah:
      -- sum of their pseukim (read sub-aliyot inside this range) equals the standard aliyah total
      -- chapter*1000+verse encoding handles cross-chapter ranges (Torah max ~50v/ch, well under 999)
      -- e.g. Pesach Day 1 aliyot 1+2 (4+4 pseukim) fully cover Bo aliyah 5 (8 pseukim)
      (SELECT MIN(sr.date_read) FROM special_readings sr
       JOIN occasion_aliyot oa ON oa.id = sr.occasion_aliyah_id
       WHERE oa.parsha_id = a.parsha_id
         AND oa.covers_aliyah_id IS NULL
         AND a.chapter_start > 0
         AND (oa.chapter_start * 1000 + oa.verse_start) >= (a.chapter_start * 1000 + a.verse_start)
         AND (oa.chapter_end   * 1000 + oa.verse_end)   <= (a.chapter_end   * 1000 + a.verse_end)
       HAVING SUM(oa.pseukim) >= a.pseukim),
      -- holiday aliyah that fully contains this standard aliyah (e.g. Simchat Torah over Vezot HaBracha aliyot)
      (SELECT sr.date_read FROM special_readings sr
       JOIN occasion_aliyot oa ON oa.id = sr.occasion_aliyah_id
       WHERE oa.parsha_id = a.parsha_id
         AND oa.covers_aliyah_id IS NULL
         AND (oa.chapter_start * 1000 + oa.verse_start) <= (a.chapter_start * 1000 + a.verse_start)
         AND (oa.chapter_end   * 1000 + oa.verse_end)   >= (a.chapter_end   * 1000 + a.verse_end)
       ORDER BY sr.date_read LIMIT 1),
      '') AS orig,
    COALESCE(
      -- direct standard/double-parsha reading of this aliyah
      (SELECT date_read FROM readings
       WHERE aliyah_id = a.id AND reading_type IN ('standard', 'double_parsha')
       ORDER BY date_read LIMIT 1),
      -- this aliyah is fully contained within another standard aliyah that has been read
      -- (e.g. maftir inside aliyah 7) — read in its normal division, so it counts as direct
      (SELECT r.date_read FROM readings r
       JOIN aliyot o ON o.id = r.aliyah_id
       WHERE o.parsha_id = a.parsha_id
         AND o.id != a.id
         AND r.reading_type IN ('standard', 'double_parsha')
         AND (o.chapter_start * 1000 + o.verse_start) <= (a.chapter_start * 1000 + a.verse_start)
         AND (o.chapter_end   * 1000 + o.verse_end)   >= (a.chapter_end   * 1000 + a.verse_end)
       ORDER BY r.date_read LIMIT 1),
      -- NOTE: holiday-coverage branches are deliberately excluded — an aliyah read only
      -- because a holiday's sub-aliyot covered it was not read in its standard division.
      '') AS direct_orig,
    -- reading_type of the direct reading: distinguishes an aliyah actually read as part of a
    -- double parsha from one read standalone in a regular year (pair membership alone is not
    -- enough — Balak's aliyot carry pair metadata even when read on their own).
    (SELECT reading_type FROM readings
     WHERE aliyah_id = a.id AND reading_type IN ('standard', 'double_parsha')
     ORDER BY date_read LIMIT 1) AS read_type,
    COALESCE(
      (SELECT GROUP_CONCAT(date_read, ',') FROM (
        SELECT date_read FROM readings
        WHERE aliyah_id = a.id AND reading_type = 'additional'
        ORDER BY date_read
      )), '') AS fut,
    COALESCE(
      (SELECT occasion FROM readings
       WHERE aliyah_id = a.id AND reading_type IN ('standard', 'double_parsha')
       ORDER BY date_read LIMIT 1),
      (SELECT o.name_en FROM occasions o
       JOIN occasion_aliyot oa ON oa.occasion_id = o.id
       JOIN special_readings sr ON sr.occasion_aliyah_id = oa.id
       WHERE oa.covers_aliyah_id = a.id
       ORDER BY sr.date_read LIMIT 1),
      '') AS occasion,
    COALESCE(
      (SELECT location FROM readings
       WHERE aliyah_id = a.id AND reading_type IN ('standard', 'double_parsha')
       ORDER BY date_read LIMIT 1),
      (SELECT sr.location FROM special_readings sr
       JOIN occasion_aliyot oa ON oa.id = sr.occasion_aliyah_id
       WHERE oa.covers_aliyah_id = a.id
       ORDER BY sr.date_read LIMIT 1),
      '') AS location,
    (SELECT COUNT(*) FROM readings
     WHERE aliyah_id = a.id AND reading_type = 'additional') AS reread_count
  FROM aliyot a
  JOIN parshiot    p  ON p.id  = a.parsha_id
  JOIN sefarim     s  ON s.id  = p.sefer_id
  LEFT JOIN parsha_pairs pp ON pp.id = a.pair_id
  ORDER BY p.sort_order, a.aliyah
`;

export const READINGS_SQL = `
  SELECT r.id, s.name AS sefer, p.name AS parsha, p.name_en AS parsha_en,
         a.aliyah, r.date_read,
         COALESCE(r.occasion, '') AS occasion,
         COALESCE(r.location, '') AS location,
         r.reading_type,
         COALESCE(pp.name, '') AS pair_name
  FROM readings r
  JOIN aliyot        a  ON a.id  = r.aliyah_id
  JOIN parshiot      p  ON p.id  = a.parsha_id
  JOIN sefarim       s  ON s.id  = p.sefer_id
  LEFT JOIN parsha_pairs pp ON pp.id = a.pair_id
  ORDER BY r.date_read DESC, p.sort_order, a.aliyah
`;

export const OCCASIONS_SQL = `
  SELECT o.id, o.name, o.name_en, o.category, o.sort_order
  FROM occasions o
  ORDER BY o.sort_order
`;

export const OCCASION_ALIYOT_SQL = `
  SELECT
    oa.id,
    oa.occasion_id,
    o.name     AS occasion,
    o.name_en  AS occasion_en,
    o.category,
    oa.aliyah_key,
    oa.is_shabbat_variant,
    oa.parsha_id,
    p.name     AS parsha,
    p.name_en  AS parsha_en,
    s.name     AS sefer,
    s.name_en  AS sefer_en,
    s.color    AS sefer_color,
    oa.pseukim,
    oa.chapter_start,
    oa.verse_start,
    oa.chapter_end,
    oa.verse_end,
    oa.covers_aliyah_id,
    COALESCE(
      (SELECT date_read FROM special_readings
       WHERE occasion_aliyah_id = oa.id ORDER BY date_read LIMIT 1),
      (SELECT r.date_read FROM readings r
       JOIN aliyot a ON a.id = r.aliyah_id
       WHERE a.parsha_id = oa.parsha_id
         AND (a.chapter_start * 1000 + a.verse_start) <= (oa.chapter_start * 1000 + oa.verse_start)
         AND (a.chapter_end   * 1000 + a.verse_end)   >= (oa.chapter_end   * 1000 + oa.verse_end)
         AND r.reading_type IN ('standard', 'double_parsha')
       ORDER BY r.date_read LIMIT 1),
      '') AS orig,
    COALESCE(
      (SELECT GROUP_CONCAT(date_read, ',') FROM (
        SELECT date_read FROM special_readings
        WHERE occasion_aliyah_id = oa.id ORDER BY date_read
      )), '') AS all_dates,
    (SELECT COUNT(*) FROM special_readings
     WHERE occasion_aliyah_id = oa.id) AS read_count
  FROM occasion_aliyot oa
  JOIN occasions o ON o.id  = oa.occasion_id
  JOIN parshiot  p ON p.id  = oa.parsha_id
  JOIN sefarim   s ON s.id  = p.sefer_id
  ORDER BY o.sort_order, oa.is_shabbat_variant, oa.aliyah_key
`;

export const SPECIAL_READINGS_SQL = `
  SELECT
    sr.id,
    sr.occasion_aliyah_id,
    oa.occasion_id,
    o.name     AS occasion,
    o.name_en  AS occasion_en,
    o.category,
    oa.aliyah_key,
    oa.is_shabbat_variant,
    p.name     AS parsha,
    p.name_en  AS parsha_en,
    sr.date_read,
    COALESCE(sr.note, '')     AS note,
    COALESCE(sr.location, '') AS location,
    oa.pseukim,
    oa.covers_aliyah_id
  FROM special_readings sr
  JOIN occasion_aliyot oa ON oa.id  = sr.occasion_aliyah_id
  JOIN occasions       o  ON o.id   = oa.occasion_id
  JOIN parshiot        p  ON p.id   = oa.parsha_id
  ORDER BY sr.date_read DESC, o.sort_order, oa.aliyah_key
`;

export const WEEKDAY_ALIYOT_SQL = `
  SELECT
    wa.id,
    wa.parsha_id,
    wa.aliyah_num,
    p.name     AS parsha,
    p.name_en  AS parsha_en,
    s.name     AS sefer,
    s.name_en  AS sefer_en,
    s.color    AS sefer_color,
    wa.pseukim,
    wa.chapter_start,
    wa.verse_start,
    wa.chapter_end,
    wa.verse_end,
    wa.covers_aliyah_id,
    COALESCE(
      (SELECT GROUP_CONCAT(date_read, ',') FROM (
        SELECT date_read FROM weekday_readings
        WHERE weekday_aliyah_id = wa.id ORDER BY date_read
      )), '') AS all_dates,
    COALESCE(
      (SELECT id FROM weekday_readings
       WHERE weekday_aliyah_id = wa.id ORDER BY date_read LIMIT 1), 0) AS reading_id,
    COALESCE(
      (SELECT location FROM weekday_readings
       WHERE weekday_aliyah_id = wa.id ORDER BY date_read LIMIT 1), '') AS location,
    COALESCE(
      (SELECT note FROM weekday_readings
       WHERE weekday_aliyah_id = wa.id ORDER BY date_read LIMIT 1), '') AS note
  FROM weekday_aliyot wa
  JOIN parshiot p ON p.id = wa.parsha_id
  JOIN sefarim  s ON s.id = p.sefer_id
  ORDER BY p.sort_order, wa.aliyah_num
`;


export const HOSAFOT_READINGS_SQL = `
  SELECT
    hr.id,
    hr.sefer,
    hr.parsha_id_1,
    hr.parsha_id_2,
    hr.occasion_id,
    hr.is_double_parsha,
    hr.chapter_start,
    hr.verse_start,
    hr.chapter_end,
    hr.verse_end,
    hr.pseukim,
    hr.date_read,
    COALESCE(hr.note,     '') AS note,
    COALESCE(hr.location, '') AS location,
    COALESCE(p1.name,    '') AS parsha1,
    COALESCE(p1.name_en, '') AS parsha1_en,
    p2.name    AS parsha2,
    p2.name_en AS parsha2_en,
    o.name     AS occasion,
    o.name_en  AS occasion_en
  FROM hosafot_readings hr
  LEFT JOIN parshiot p1 ON p1.id = hr.parsha_id_1
  LEFT JOIN parshiot p2 ON p2.id = hr.parsha_id_2
  LEFT JOIN occasions o  ON o.id  = hr.occasion_id
  ORDER BY hr.date_read
`;

export const LOCATION_STATS_SQL = `
  SELECT COALESCE(location, '') AS location,
    COUNT(*) AS count,
    SUM(CASE WHEN date_read <= date('now') THEN 1 ELSE 0 END) AS past_count,
    SUM(CASE WHEN date_read > date('now') THEN 1 ELSE 0 END) AS upcoming_count
  FROM (
    SELECT location, date_read FROM readings
    UNION ALL
    SELECT location, date_read FROM special_readings
  )
  GROUP BY location
  ORDER BY count DESC, location
`;
