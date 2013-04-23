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


--
-- Sensors
--
CREATE TABLE Sensors (
    row_id INTEGER PRIMARY KEY,
    sensor_id INTEGER,
    name VARCHAR(255),
    location VARCHAR(255)
);

--
-- one type for each type a sensor supports
--
CREATE TABLE SensorTypes (
    row_id INTEGER PRIMARY KEY,
    sensor_id INTEGER,
    type VARCHAR(255)
);