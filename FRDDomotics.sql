--
-- temperature
--
CREATE TABLE temperature (
  id INTEGER PRIMARY KEY,
  sensor_id INTEGER,
  measurement_date DATETIME,
  value REAL NOT NULL
);
