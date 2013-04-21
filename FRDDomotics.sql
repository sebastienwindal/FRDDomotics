--
-- temperature
--
CREATE TABLE Temperatures (
  row_id INTEGER PRIMARY KEY,
  sensor_id INTEGER,
  measurement_date DATETIME,
  value REAL NOT NULL
);
