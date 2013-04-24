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


var Sensor = sequelize.define(  'Sensor',
                                {
                                    row_id: {   type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
                                    sensor_id: Sequelize.INTEGER,
                                    name: Sequelize.STRING,
                                    location: Sequelize.STRING
                                },
                                {
                                    timestamps: false
                                }
                                );

var SensorType = sequelize.define(  'SensorType',
                                    {
                                        row_id: {   type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
                                        sensor_id: Sequelize.INTEGER,
                                        type: Sequelize.STRING
                                    },
                                    {
                                        timestamps: false
                                    }
                                    );

Sensor.hasMany(SensorType, {as: 'sensorTypes'});


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


function FilterFromOptions(options) {
    
    var filter = {  where: ['sensor_id=?', sensorID],
                    order: 'measurement_date DESC'
                    };

    if (options.numberPoints) {
        filter.limit = options.numberPoints;
    }
    if (options.startDate && options.endDate) {
        filter.where = ["sensor_id=? AND measurement_date >= ? AND measurement_date <= ?", sensorID, options.startDate, options.endDate];
    }
    if (options.timeSpan) {
        var endDate = new Date();
        var startDate = new Date(endDate.getTime() - options.timeSpan * 1000);
        filter.where = ["sensor_id=? AND measurement_date >= ? AND measurement_date <= ?", sensorID, startDate, endDate];   
    }
    return filter;
}

function GetLastTemperatureForSensor(sensorID, successFn, errorFn) {

    GetTemperatureForSensor(sensorID, 1, successFn, errorFn);
}

function GetTemperaturesForSensor(sensorID, options, successFn, errorFn) {

    var result = {};

    var filter = FilterFromOptions(options);

    TemperatureMeasurement  .findAll(filter)
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


function GetHumidityForSensor(sensorID, options, successFn, errorFn) {

    var result = {};

    var filter = FilterFromOptions(options);

    HumidityMeasurement .findAll(filter)
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



function GetLuminosityForSensor(sensorID, options, successFn, errorFn) {

    var result = {};

    var filter = FilterFromOptions(options);

    LuminosityMeasurement   .findAll(filter)
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

function GetAllSensors(successFn, errorFn) {

    var result = [];

    Sensor  .findAll()
            .success(function(sensors) {
                var result = [];
                for (var i in sensors) {
                    result.push({
                        sensor_id: sensors[i].sensor_id,
                        name: sensors[i].name,
                        location: sensors[i].location,
                        types: ""
                    });
                }
                successFn(result);
            })
            .error(function(err) {
                errorFn(err);
            })
}


function GetSensor(sensorID, successFn, errorFn) {
    var result = {};

    Sensor  .findAll({  where: ['sensor_id=?', sensorID],
                        limit: 1 })
            .success(function(sensors) {
                
                if (sensors.length > 0) {
                    result.sensor_id = sensors[0].sensor_id;
                    result.name = sensors[0].name;
                    result.location = sensors[0].location;
                    result.types = "";
                    successFn(result);
                } else {
                    errorFn("No such sensor");
                }
                
            })
            .error(function(err) {
                errorFn(err);
            });
}

function UpdateSensor(sensorID, data, successFn, errorFn) {
    
    Sensor.find({  where: ['sensor_id=?', sensorID] }).success(function(sensor) {
        if (sensor) {
            sensor.name = data.name;
            sensor.location = data.location;
            sensor.save().success(successFn).error(errorFn);
        } else {
            errorFn("could not find sensor.");
        }
    });
}

exports.SaveLuminosity = SaveLuminosity;
exports.SaveHumidity = SaveHumidity;
exports.SaveTemperature = SaveTemperature;
exports.GetLastTemperatureForSensor = GetLastTemperatureForSensor;
exports.GetTemperaturesForSensor = GetTemperaturesForSensor;
exports.GetHumidityForSensor = GetHumidityForSensor;
exports.GetLuminosityForSensor = GetLuminosityForSensor;
exports.GetSensor = GetSensor;
exports.GetAllSensors = GetAllSensors;
exports.UpdateSensor = UpdateSensor;
