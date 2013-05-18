var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/FRDDomotics');
var Schema = mongoose.Schema;
var async = require('async');
var moment = require('moment');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // yay!
});

var sensorSchema = new Schema({
    sensor_id: Number,
    name: String,
    description: String,
    location: String,
    capabilities: [String]
});

sensorSchema.index({ sensor_id: 1 });
sensorSchema.set('autoIndex', false);

var Sensor = mongoose.model('Sensor', sensorSchema);

// raw records
var rawMeasurementSchema = new Schema({
    sensor_id: Number,
    measurement_type: String,
    date: Date,
    value: Number
});

rawMeasurementSchema.index({ sensor_id:1, measurement_type:1, date:1});
rawMeasurementSchema.set('autoIndex', false);

var RawMeasurement = mongoose.model('RawMeasurement', rawMeasurementSchema);

// rollup records. We will have hourly records

var rollupMeasurementSchema = new Schema({
    sensor_id: Number,
    measurement_type: String,
    date: Date,
    cumul_value: Number,
    duration: Number,
    min_value: Number,
    max_value: Number,
    last_measurement_date: Date
});

rollupMeasurementSchema.index({sensor_id:1, measurement_type:1, date:1});
rollupMeasurementSchema.set('autoIndex', false);

var HourlyMeasurement = mongoose.model('HourlyMeasurement', rollupMeasurementSchema);


function GetSensor2(sensorID, successFn, errorFn) {
    Sensor  .find({ sensor_id: sensorID})
            .select({_id: 0, __v: 0})
            .exec(function(err, sensor) {
        if (err)
            errorFn(err);
        else {
            if (sensor.length == 1) {
                successFn(sensor[0]);
            } else {
                successFn({}); 
            }
        }
    });
}
function GetAllSensors2(successFn, errorFn) {
    Sensor  .find({ })
            .sort('name')
            .select({_id: 0, __v: 0})
            .exec(function(err, sensor) {
                if (err)
                    errorFn(err);
                else 
                    successFn(sensor);
            });
}
function CreateSensor2(sensor, successFn, errorFn) {

    if (!sensor.sensor_id) {
        errorFn("invalid sensor ID");
        return;
    }

    if (!sensor.capabilities || sensor.capabilities.length == 0) {
        errorFn("sensor must have at least one capability")
        return;
    }

    var newSensor = new Sensor({
        sensor_id: sensor.sensor_id,
        name: sensor.name,
        description: sensor.description,
        location: sensor.location,
        capabilities: sensor.capabilities
    });

    newSensor.save(function(err, createdSensor) {
        if (err)
            errorFn(err);
        else
            successFn();
    });
}

function RemoveSensor2(sensorID, successFn, errorFn) {

    Sensor  .remove({ sensor_id: sensorID })
                    .exec(function(err) {
                        if (err)
                            errorFn(err);
                        else
                            successFn();
                    });
}

function UpdateSensor2(sensor, successFn, errorFn) {
    Sensor.update({ sensor_id: sensor.sensor_id }, 
                { $set: sensor }, 
                function(err) {
                    if (err) errorFn(err);
                    else
                        successFn();
                });
}


function SaveMeasurement2(measurementModel, updateHourly, successFn, errorFn) {

    // start by adding a raw record...
    measurementModel.save(function(err, newMeasurement) {
        if (err)
            errorFn(err);
        else
            successFn(newMeasurement);
    });

    if (!updateHourly)
        return;

    var d = GetHourBoundaryDate(measurementModel.date);

    var filter = {
        sensor_id: measurementModel.sensor_id,
        measurement_type: measurementModel.measurement_type,
        date: d
    };

    HourlyMeasurement.findOne(  filter, 
                                function(err, hourly) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    if (!hourly) {
                                        hourly = new HourlyMeasurement({
                                            sensor_id: measurementModel.sensor_id,
                                            measurement_type: measurementModel.measurement_type,
                                            date: d,
                                            cumul_value: 0,
                                            min_value: 999999999,
                                            max_value: -999999999,
                                            duration: 0
                                        });
                                        hourly.save();
                                    }

                                    // update
                                    hourly.min_value = Math.min(hourly.min_value, measurementModel.value);
                                    hourly.max_value = Math.max(hourly.max_value, measurementModel.value);
                                    
                                    var durationDelta;
                                    if (hourly.last_measurement_date)
                                        durationDelta = (measurementModel.date.getTime() - hourly.last_measurement_date.getTime())/1000;
                                    else
                                        durationDelta = (measurementModel.date.getTime() - d.getTime())/1000;
                                    
                                    hourly.duration += durationDelta;
                                    hourly.cumul_value += measurementModel.value * durationDelta;
                                    hourly.last_measurement_date = measurementModel.date;
                                    hourly.save();
                                });

}

function SaveTemperature2(sensorID, temperatureC, date, updateHourly, successFn, errorFn) {

    if (!sensorID)
        errorFn("invalid sensor ID");
    if (!date)
        errorFn("invalid date")

    var measurement = new RawMeasurement({
        sensor_id: sensorID,
        measurement_type: "temperature",
        value: temperatureC,
        date: date
    });

    SaveMeasurement2(measurement, updateHourly, successFn, errorFn);
}

function SaveLuminosity2(sensorID, lumen, date, updateHourly, successFn, errorFn) {

    if (!sensorID) {
        errorFn("invalid sensor ID");
        return;
    }
    if (!date) {
        errorFn("invalid date")
        return;
    }

    var measurement = new RawMeasurement({
        sensor_id: sensorID,
        measurement_type: "luminosity",
        value: lumen,
        date: date
    });

    SaveMeasurement2(measurement, updateHourly, successFn, errorFn);
}

function SaveHumidity2(sensorID, humidity, date, updateHourly, successFn, errorFn) {

    if (!sensorID) {
        errorFn("invalid sensor ID");
        return;
    }
    if (!date) {
        errorFn("invalid date")
        return;
    }

    var measurement = new RawMeasurement({
        sensor_id: sensorID,
        measurement_type: "humidity",
        value: humidity,
        date: date
    });

    SaveMeasurement2(measurement, updateHourly, successFn, errorFn);
}

function GetStats(successFn, errorFn) {
    HourlyMeasurement.db.db.executeDbCommand({collStats: "collection"}, function(err, res) {
	if (err)
		errorFn(err);
	else
		successFn(res);
    });

}


function GetHourBoundaryDate(date) {
    var d = new Date(   date.getFullYear(), 
                        date.getMonth(),
                        date.getDate(), 
                        date.getHours(), 0, 0, 0);
    return d;
}

function SaveHourlyMeasurement(sensorID, measurementType, measurementDate, cumulValue, minValue, maxValue, duration, lastMeasurementDate) {

    hourly = new HourlyMeasurement({
                                        sensor_id: sensorID,
                                        measurement_type: measurementType,
                                        date: GetHourBoundaryDate(measurementDate),
                                        cumul_value: cumulValue,
                                        min_value: minValue,
                                        max_value: maxValue,
                                        duration: duration,
                                        last_measurement_date: lastMeasurementDate
                                    });
    hourly.save();
}


function GetLastValue(measurementType, sensorID, successFn, errorFn) {
    if (!sensorID)
        errorFn("invalid sensorID");

    async.parallel(
        {
            lastOne: function(callback){
                RawMeasurement.find({   sensor_id: sensorID, 
                                        measurement_type: measurementType
                                    })
                  .limit(1)
                  .sort("-date")
                  .exec(callback);
            },
            anHourAgo: function(callback){
                var anHourAgoDate = moment().subtract('hours', 1);
                RawMeasurement.find({   sensor_id: sensorID, 
                                        measurement_type: measurementType
                                    })
                  .where('date').lt(anHourAgoDate)
                  .limit(1)
                  .sort("-date")
                  .exec(callback);
            },
            aDayAgo: function(callback){
                var aDayAgoDate = moment().subtract('days', 1);
                RawMeasurement.find({
                                        sensor_id: sensorID, 
                                        measurement_type: measurementType
                                    })
                  .where('date').lt(aDayAgoDate)
                  .limit(1)
                  .sort("-date")
                  .exec(callback);
            }
        }, 
        function(err, data){
            if (err) {
                errorFn(err);
            } else {
                var result = {};
                if (data.lastOne && data.anHourAgo && data.aDayAgo) {
                    result.values = [];
                    result.date_offset = [];
                    result.sensor_id = sensorID;
                    result.measurement_type = measurementType;
                    if (data.lastOne.length > 0) {
                        result.most_recent_measurement_date = data.lastOne[0].date;
                    }
                    if (data.aDayAgo.length > 0) {
                        result.oldest_measurement_date = data.aDayAgo[0].date;
                    } else if (data.anHourAgo.length > 0) {
                        result.oldest_measurement_date = data.anHourAgo[0].date;
                    } else {
                        result.oldest_measurement_date = data.lastOne[0].date;
                    }
                    var timeStamp = result.oldest_measurement_date.getTime()/1000;

                    result.values.unshift(data.lastOne[0].value);
                    result.date_offset.unshift(data.lastOne[0].date.getTime()/1000 - timeStamp);

                    if (data.anHourAgo.length > 0) {
                        result.values.unshift(data.anHourAgo[0].value);
                        result.date_offset.unshift(data.anHourAgo[0].date.getTime()/1000 - timeStamp);
                    }

                    if (data.aDayAgo.length > 0) {
                        result.values.unshift(data.aDayAgo[0].value);
                        result.date_offset.unshift(data.aDayAgo[0].date.getTime()/1000 - timeStamp);
                    }
                }
                successFn(result);
            }
        }
    );

}

function GetHourlyTemperatures2(sensorID, successFn, errorFn) {
    if (!sensorID)
        errorFn("invalid sensorID");

    HourlyMeasurement.find( { sensor_id: sensorID, measurement_type: "temperature"})
                     .sort("date")
                     .exec(function(err, measurements) {
                        if (err)
                            errorFn(err);
                        else 
                            successFn(measurements);
                     });
}

function GetRawMeasurement(sensorID, measurementType, options, successFn, errorFn) {

    var filter = {
        measurement_type: measurementType,
        sensor_id: sensorID,
    };

    var limit = 0;
    if (options) {
        if (options.timeSpan) {
            var startDate = new Date();
            startDate = new Date(startDate.getTime() - options.timeSpan * 1000);
            filter.date = { $gte: startDate };
        } else if (options.startDate || options.endDate) {
            if (options.startDate && options.endDate)
                filter.date = { $gte: options.startDate, $lte: options.endDate };
            else if (options.startDate && !options.endDate)
                filter.date = { $gte: options.startDate };
            else if (!startDate && endDate)
                filter.date = { $lte: options.endDate };
        }
        if (options.numberPoints) {
            limit = options.numberPoints;
        }
    }

    var result = {};

    RawMeasurement  .find(filter)
                    .sort("-date")
                    .limit(limit)
                    .select({_id: 0, __v: 0})
                    .exec(function(err, data) {
                        if (err)
                            errorFn(err);
                        else {
                            result.sensor_id = sensorID;
                            result.measurement_type = measurementType;
                            result.values = [];
                            result.date_offset = [];

                            if (data.length > 0) {
                                result.most_recent_measurement_date = data[0].date;
                                result.oldest_measurement_date = data[data.length-1].date;

                                var timeStamp = result.oldest_measurement_date.getTime()/1000;

                                for (i in data) {
                                    var point = data[i];
                                    result.values.unshift(point.value);
                                    var deltaTime = point.date.getTime()/1000 - timeStamp; 
                                    result.date_offset.unshift(deltaTime);
                                }
                            }
                            successFn(result);
                        }
                    });
}


function GetHourlyMeasurement(sensorID, measurementType, options, successFn, errorFn) {

    var filter = {
        measurement_type: measurementType,
        sensor_id: sensorID,
    };
    var limit = 0;
    if (options) {
        if (options.timeSpan) {
            var startDate = new Date();
            startDate = new Date(startDate.getTime() - options.timeSpan * 1000);
            filter.date = { $gte: startDate };
        } else if (options.startDate || options.endDate) {
            if (options.startDate && options.endDate)
                filter.date = { $gte: options.startDate, $lte: options.endDate };
            else if (options.startDate && !options.endDate)
                filter.date = { $gte: options.startDate };
            else if (!startDate && endDate)
                filter.date = { $lte: options.endDate };
        }
        if (options.numberPoints) {
            limit = options.numberPoints;
        }
    }

    var result = {};

    HourlyMeasurement.find(filter)
                    .sort("-date")
                    .limit(limit)
                    .select({_id: 0, __v: 0})
                    .exec(function(err, data) {
                        if (err)
                            errorFn(err);
                        else {
                            result.sensor_id = sensorID;
                            result.measurement_type = measurementType;
                            result.hour_offset = [];

                            result.mean_values = [];
                            result.max_values = [];
                            result.min_values = [];

                            if (data.length > 0) {
                                result.most_recent_measurement_date = data[0].date;
                                result.oldest_measurement_date = data[data.length-1].date;

                                var timeStamp = result.oldest_measurement_date.getTime()/1000;

                                for (i in data) {
                                    var point = data[i];
                                    result.min_values.unshift(point.min_value);
                                    result.max_values.unshift(point.max_value);
                                    result.mean_values.unshift(point.cumul_value / point.duration);
                                    var deltaTime = point.date.getTime()/1000 - timeStamp; 
                                    result.hour_offset.unshift(deltaTime/3600);
                                }   
                            }
                            successFn(result);
                        }
                    });
}


function RemoveRawMeasurementOlderThan(sensorID, measurementType, date, successFn, errorFn) {
    
    var filter = {
        measurement_type: measurementType,
        sensor_id: sensorID
    };

    if (date) {
        filter.date = { $lte: date };
    }

    RawMeasurement  .remove(filter)
                    .exec(function(err) {
                        if (err)
                            errorFn(err);
                        else
                            successFn();
                    });
}

function RemoveHourlyMeasurementOlderThan(sensorID, measurementType, date, successFn, errorFn) {
    
    var filter = {
        measurement_type: measurementType,
        sensor_id: sensorID
    };

    if (date) {
        filter.date = { $lte: date };
    }
    HourlyMeasurement  .remove(filter)
                        .exec(function(err) {
                            if (err)
                                errorFn(err);
                            else
                                successFn();
                        });
}

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


var SensorTable = sequelize.define(  'Sensor',
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

SensorTable.hasMany(SensorType, {as: 'sensorTypes'});


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


function FilterFromOptions(options, sensorID) {
    
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

function GetTemperatureForSensor(sensorID, options, successFn, errorFn) {

    var result = {};

    //options.numberPoints = 5

    var filter = FilterFromOptions(options, sensorID);

    TemperatureMeasurement  .findAll(filter)
                            .success(function(temp) {
                                result.sensorID = sensorID;
                                result.temperatures = [];
                                result.date_offset = [];
                                temp.reverse();

                                if (temp.length > 0) {
                                    result.oldest_measurement_date = temp[0].selectedValues.measurement_date;
				                    result.most_recent_measurement_date = temp[temp.length-1].selectedValues.measurement_date;

				                    var lastTimestamp = result.oldest_measurement_date.getTime()/1000;

                                    for (i in temp) {
                                        var point = temp[i].selectedValues;
                                        result.temperatures.push(point.value);
					                    var deltaTime = point.measurement_date.getTime()/1000 - lastTimestamp; 
                                        result.date_offset.push(deltaTime);
                                    }
                                }
                                //console.log(result);
                                successFn(result);
                            })
                            .error(function(err) {
                                errorFn(err);   
                            });
}



function GetHumidityForSensor(sensorID, options, successFn, errorFn) {

    var result = {};

    //options.numberPoints = 5;

    var filter = FilterFromOptions(options, sensorID);

    HumidityMeasurement .findAll(filter)
                        .success(function(hum) {
                            hum.reverse();
                            result.sensorID = sensorID;
                            result.humidity = [];
                            result.date_offset = [];

                            if (hum.length > 0) {
                                    result.oldest_measurement_date = hum[0].selectedValues.measurement_date;
                                    result.most_recent_measurement_date = hum[hum.length-1].selectedValues.measurement_date;

                                var lastTimestamp = result.oldest_measurement_date.getTime()/1000;

                                for (i in hum) {
                                    var point = hum[i].selectedValues;
                                    result.humidity.push(point.value);
                                    var deltaTime = point.measurement_date.getTime()/1000 - lastTimestamp; 
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

    //options.numberPoints = 5;

    var filter = FilterFromOptions(options, sensorID);

    LuminosityMeasurement   .findAll(filter)
                            .success(function(lum) {
                                lum.reverse();
                                result.sensorID = sensorID;
                                result.luminosity = [];
                                result.date_offset = [];

                                if (lum.length > 0) {
                                    result.oldest_measurement_date = lum[0].selectedValues.measurement_date;
                                    result.most_recent_measurement_date = lum[lum.length-1].selectedValues.measurement_date;
                                    var lastTimestamp = result.oldest_measurement_date.getTime()/1000;

                                    for (i in lum) {
                                        var point = lum[i].selectedValues;
                                        result.luminosity.push(point.value);
                                        var deltaTime = point.measurement_date.getTime()/1000 - lastTimestamp; 
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

    SensorTable  .findAll()
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

    SensorTable  .findAll({  where: ['sensor_id=?', sensorID],
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
    
    SensorTable.find({  where: ['sensor_id=?', sensorID] }).success(function(sensor) {
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
exports.GetTemperatureForSensor = GetTemperatureForSensor;
exports.GetHumidityForSensor = GetHumidityForSensor;
exports.GetLuminosityForSensor = GetLuminosityForSensor;
exports.GetSensor = GetSensor;
exports.GetAllSensors = GetAllSensors;
exports.UpdateSensor = UpdateSensor;

exports.GetSensor2 = GetSensor2;
exports.GetAllSensors2 = GetAllSensors2;
exports.CreateSensor2 = CreateSensor2;
exports.RemoveSensor2 = RemoveSensor2;
exports.UpdateSensor2 = UpdateSensor2;
exports.SaveTemperature2 = SaveTemperature2;
exports.SaveLuminosity2 = SaveLuminosity2;
exports.SaveHumidity2 = SaveHumidity2;
exports.GetRawMeasurement = GetRawMeasurement;
exports.GetHourlyMeasurement = GetHourlyMeasurement;
exports.GetLastValue = GetLastValue;

exports.RemoveHourlyMeasurementOlderThan = RemoveHourlyMeasurementOlderThan;
exports.RemoveRawMeasurementOlderThan = RemoveRawMeasurementOlderThan;
exports.SaveHourlyMeasurement = SaveHourlyMeasurement;

exports.GetStats = GetStats;

exports.GetHourBoundaryDate = GetHourBoundaryDate;
