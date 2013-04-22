var Sequelize = require("sequelize");

var sequelize = new Sequelize(  'FRDDomotics', 
                                '', 
                                '',
                                {
                                    dialect: 'sqlite',
                                    storage: 'FRDDomotics.db'
                                });

// create an object we can use to manipulate data in the Temperature table.
var TemperatureMeasurement = sequelize.define(  'Temperature', 
                                                {
                                                    row_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
                                                    sensor_id: Sequelize.INTEGER,
                                                    measurement_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
                                                    value: { type: Sequelize.FLOAT, allowNull: false }
                                                },
                                                {
                                                    // don't add the timestamp attributes (updatedAt, createdAt)
                                                    timestamps: false
                                                }
                                                );


// create an object we can use to manipulate data in the Temperature table.
var HumidityMeasurement = sequelize.define( 'Humidity', 
                                            {
                                                row_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
                                                sensor_id: Sequelize.INTEGER,
                                                measurement_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
                                                value: { type: Sequelize.FLOAT, allowNull: false }
                                            },
                                            {
                                                timestamps: false, // don't add the timestamp attributes (updatedAt, createdAt)
                                                freezeTableName: true // don't auto pluralize table name
                                            }
                                            );

// create an object we can use to manipulate data in the Temperature table.
var LuminosityMeasurement = sequelize.define(   'Luminosity', 
                                                {
                                                    row_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
                                                    sensor_id: Sequelize.INTEGER,
                                                    measurement_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
                                                    value: { type: Sequelize.FLOAT, allowNull: false }
                                                },
                                                {
                                                    timestamps: false, // don't add the timestamp attributes (updatedAt, createdAt)
                                                    freezeTableName: true // don't auto pluralize table name
                                                }
                                                );


function SaveTemperature(sensorID, date, temperature, successFn, errorFn) {
    var temperatureRow = TemperatureMeasurement.build(
                            {
                                sensor_id: sensorID,
                                measurement_date: date,
                                value: temperature
                            });
    temperatureRow  .save()
                    .success(function(t) {
                        successFn();
                    })
                    .error(function(error) {
                        errorFn(error);
                    });
}

function SaveHumidity(sensorID, date, humidity, successFn, errorFn) {
    var humidityRow = HumidityMeasurement.build(
                            {
                                sensor_id: sensorID,
                                measurement_date: date,
                                value: humidity
                            });
    humidityRow .save()
                .success(function(h) {
                    successFn();
                })
                .error(function(error) {
                    errorFn(error);
                });
}

function SaveLuminosity(sensorID, date, luminosity, successFn, errorFn) {
    var luminosityRow = LuminosityMeasurement.build(
                            {
                                sensor_id: sensorID,
                                measurement_date: date,
                                value: luminosity
                            });
    luminosityRow   .save()
                    .success(function(l) {
                        successFn();
                    })
                    .error(function(error) {
                        errorFn(error);
                    });
}


function GetLastTemperatureForSensor(sensorID, successFn, errorFn) {

    GetTemperatureForSensor(sensorID, 1, successFn, errorFn);
}

function GetTemperaturesForSensor(sensorID, numberPoints, successFn, errorFn) {

    var result = {};

    TemperatureMeasurement  .findAll({  where: ['sensor_id=?', sensorID],
                                        order: 'measurement_date DESC', 
                                        limit: numberPoints})
                            .success(function(temp) {
                                result.sensorID = sensorID;
                                result.temperatures = [];
                                result.date_offset = [];

                                if (temp.length > 0) {
                                    result.most_recent_measurement_date = temp[0].selectedValues.measurement_date;
				    
				                    var lastTimestamp = result.most_recent_measurement_date.getTime()/1000;

                                    for (i in temp) {
                                        var point = temp[i].selectedValues;
                                        result.temperatures.push(point.value);
					                    var deltaTime = lastTimestamp - point.measurement_date.getTime()/1000; 
                                        result.date_offset.push(deltaTime);
                                    }
                                }
                                successFn(result);
                            })
                            .error(function(err) {
                                errorFn(err);   
                            });
}


function GetHumidityForSensor(sensorID, numberPoints, successFn, errorFn) {

    var result = {};

    THumidityMeasurement.findAll({  where: ['sensor_id=?', sensorID],
                                    order: 'measurement_date DESC', 
                                    limit: numberPoints})
                        .success(function(hum) {
                            result.sensorID = sensorID;
                            result.humidity = [];
                            result.date_offset = [];

                            if (hum.length > 0) {
                                result.most_recent_measurement_date = hum[0].selectedValues.measurement_date;
                
                                var lastTimestamp = result.most_recent_measurement_date.getTime()/1000;

                                for (i in hum) {
                                    var point = hum[i].selectedValues;
                                    result.humidity.push(point.value);
                                    var deltaTime = lastTimestamp - point.measurement_date.getTime()/1000; 
                                    result.date_offset.push(deltaTime);
                                }
                            }
                            successFn(result);
                        })
                        .error(function(err) {
                            errorFn(err);   
                        });
}


function GetLuminosityForSensor(sensorID, numberPoints, successFn, errorFn) {

    var result = {};

    LuminosityMeasurement   .findAll({  where: ['sensor_id=?', sensorID],
                                        order: 'measurement_date DESC', 
                                        limit: numberPoints})
                            .success(function(lum) {
                                result.sensorID = sensorID;
                                result.luminosity = [];
                                result.date_offset = [];

                                if (lum.length > 0) {
                                    result.most_recent_measurement_date = lum[0].selectedValues.measurement_date;
                    
                                    var lastTimestamp = result.most_recent_measurement_date.getTime()/1000;

                                    for (i in lum) {
                                        var point = lum[i].selectedValues;
                                        result.luminosity.push(point.value);
                                        var deltaTime = lastTimestamp - point.measurement_date.getTime()/1000; 
                                        result.date_offset.push(deltaTime);
                                    }
                                }
                                successFn(result);
                            })
                            .error(function(err) {
                                errorFn(err);   
                            });
}

exports.SaveLuminosity = SaveLuminosity;
exports.SaveHumidity = SaveHumidity;
exports.SaveTemperature = SaveTemperature;
exports.GetLastTemperatureForSensor = GetLastTemperatureForSensor;
exports.GetTemperaturesForSensor = GetTemperaturesForSensor;
exports.GetHumidityForSensor = GetHumidityForSensor;
exports.GetLuminosityForSensor = GetLuminosityForSensor;
