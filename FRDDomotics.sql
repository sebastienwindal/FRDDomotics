--
-- temperature
--
CREATE TABLE Temperatures (
  row_id INTEGER PRIMARY KEY,
  sensor_id INTEGER,
  measurement_date DATETIME,
  value REAL NOT NULL
);


--
-- Humidity
--
CREATE TABLE Humidity (
  row_id INTEGER PRIMARY KEY,
  sensor_id INTEGER,
  measurement_date DATETIME,
  value REAL NOT NULL
);

--
-- Luminosity
--
CREATE TABLE Luminosity (
  row_id INTEGER PRIMARY KEY,
  sensor_id INTEGER,
  measurement_date DATETIME,
  value REAL NOT NULL
);

