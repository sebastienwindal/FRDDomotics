var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/FRDDomotics');
var Schema = mongoose.Schema;
var async = require('async');
var moment = require('moment');
var _ = require('underscore');
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
    var promise = Sensor.find({ sensor_id: sensorID})
                        .select({_id: 0, __v: 0});

    if (successFn && errorFn) {
        promise.exec(function(err, sensor) {
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
    } else {
        return promise.exec();
    }
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

function CreateSensor(sensor) {
    if (!sensor.sensor_id) {
        var p = new mongoose.Promise();
        p.reject("invalid sensor ID");
        return p;
    }

    if (!sensor.capabilities || sensor.capabilities.length == 0) {
        var p = new mongoose.Promise();
        p.reject("sensor must have at least one capability");
        return p;
    }

    var newSensor = new Sensor({
        sensor_id: sensor.sensor_id,
        name: sensor.name,
        description: sensor.description,
        location: sensor.location,
        capabilities: sensor.capabilities
    });
    var p = new mongoose.Promise();
    newSensor.save(function(err, sensor) {
        if (err) {
            p.reject(err);
        } else {
            p.fulfill();
        }
    });
    return p;
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


    CreateSensor(sensor).then(function(err, createdSensor) {
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


function SaveLevelChange(sensorID, date, isTriggered) {

    if (!sensorID) {
        var p = new mongoose.Promise();
        p.reject("invalid sensor ID");
        return p;
    }

    var p = new mongoose.Promise();

    var measurement = new RawMeasurement({
        sensor_id: sensorID,
        measurement_type: "level",
        value: (isTriggered ? 1 : 0),
        date: date
    });

    SaveMeasurement2(measurement, 
                     false, 
                     function() {
                        console.log("saved");
                        p.fulfill();
                     }, 
                     function(err) {
                        console.log(err);
                        p.reject(err.message);
                     });
    return p;
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

function GetLastValueForAllSensors(measurementType, successFn, errorFn) {

    GetAllSensors2( function success(sensors) {
                        //var asyncRequest = 
                        //_.each(sensors, function(sensor) {

                        var asyncWrapper = function(sensorID, measurementType) {
                            return {
                                sensorID: sensorID,
                                measurementType: measurementType,
                                exec: function(callback) {
                                    GetLastValueForSensor(      measurementType,
                                                                sensorID, 
                                                                function success(data) {
                                                                    callback(null, data);
                                                                },
                                                                function error(err) {
                                                                    callback(err, null);
                                                                });
                                }
                            };
                        };

                        var asyncList = {};

                        _.each(sensors, function(sensor) {
                            if (_.contains(sensor.capabilities, measurementType)) {
                                var o = new asyncWrapper(sensor.sensor_id, measurementType);
                                asyncList[sensor.sensor_id] = o.exec;
                            }
                        });


                        async.parallel(
                            asyncList,
                            function(err, data) {
                                if (err) {
                                    errorFn(err);
                                } else {
                                    var result = [];

                                    _.map(data, function(val, key) {
                                        result.push(val);    
                                    });
                                    successFn(result);
                                }
                            }
                        );
                    },
                    errorFn);
}

function GetLastValueForSensor(measurementType, sensorID, successFn, errorFn) {
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
            },
            sensor: function(callback) {
                Sensor  .find({ sensor_id: sensorID})
                        .select({_id: 0, __v: 0})
                        .exec(callback);
            }
        }, 
        function(err, data){
            if (err) {
                errorFn(err);
            } else {
                var result = {};
                if (data.lastOne && data.anHourAgo && data.aDayAgo && data.sensor && data.sensor.length > 0) {
                    result.values = [];
                    result.date_offset = [];
                    result.sensor_id = sensorID;
                    result.location = data.sensor.location;
                    result.sensor = data.sensor[0];
                    
                    result.measurement_type = measurementType;
                    if (data.lastOne.length > 0) {
                        if (data.lastOne[0])
                            result.most_recent_measurement_date = data.lastOne[0].date;
                    }
                    if (data.aDayAgo.length > 0) {
                        if (data.aDayAgo[0])
                            result.oldest_measurement_date = data.aDayAgo[0].date;
                    } else if (data.anHourAgo.length > 0) {
                        if (data.anHourAgo[0])
                            result.oldest_measurement_date = data.anHourAgo[0].date;
                    } else {
                        if (data.lastOne[0])
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

exports.GetSensor2 = GetSensor2;
exports.GetAllSensors2 = GetAllSensors2;
exports.CreateSensor = CreateSensor;
exports.CreateSensor2 = CreateSensor2;
exports.RemoveSensor2 = RemoveSensor2;
exports.UpdateSensor2 = UpdateSensor2;
exports.SaveTemperature2 = SaveTemperature2;
exports.SaveLuminosity2 = SaveLuminosity2;
exports.SaveHumidity2 = SaveHumidity2;
exports.SaveLevelChange = SaveLevelChange;

exports.GetRawMeasurement = GetRawMeasurement;
exports.GetHourlyMeasurement = GetHourlyMeasurement;
exports.GetLastValueForSensor = GetLastValueForSensor;
exports.GetLastValueForAllSensors = GetLastValueForAllSensors;

exports.RemoveHourlyMeasurementOlderThan = RemoveHourlyMeasurementOlderThan;
exports.RemoveRawMeasurementOlderThan = RemoveRawMeasurementOlderThan;
exports.SaveHourlyMeasurement = SaveHourlyMeasurement;

exports.GetStats = GetStats;

exports.GetHourBoundaryDate = GetHourBoundaryDate;
