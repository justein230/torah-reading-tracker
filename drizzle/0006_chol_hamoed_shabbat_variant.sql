-- Custom SQL migration file, put your code below! --
-- Sukkot Shabbat Chol HaMoed and Pesach Shabbat Chol HaMoed are inherently Shabbat-only
-- readings (no weekday counterpart). Mark their aliyot as shabbat variants so they appear
-- in the Shabbat reading section of the holiday grid, not the weekday section.
UPDATE occasion_aliyot
SET is_shabbat_variant = 1
WHERE occasion_id IN (
  SELECT id FROM occasions
  WHERE name_en IN ('Sukkot Shabbat Chol HaMoed', 'Pesach Shabbat Chol HaMoed')
);