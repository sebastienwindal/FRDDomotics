var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/FRDDomotics');
var Schema = mongoose.Schema;

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
    Sensor.find({ sensor_id: sensorID}, function(err, sensor) {
        if (err)
            errorFn(err);
        else
            successFn(sensor);
    });
}

function CreateSensor2(sensor, successFn, errorFn) {

    if (!sensor.sensor_id)
        errorFn("invalid sensor ID");
    if (!sensor.capabilities || sensor.capabilities.length == 0)
        errorFn("sensor must have at least one capability")

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
    Sensor.remove({ sensor_id: sensorID }, function (err) {
        if (err) errorFn(err);
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


function SaveMeasurement2(measurementModel, successFn, errorFn) {

    // start by adding a raw record...
    console.log("measurementModel :" + measurementModel);
    measurementModel.save(function(err, newMeasurement) {
        if (err)
            errorFn(err);
        else
            successFn(newMeasurement);
    });

    var filter = {
        sensor_id: measurementModel.sensor_id,
        measurement_type: measurementModel.measurement_type,
        date: new Date( measurementModel.date.getFullYear(), 
                        measurementModel.date.getMonth(),
                        measurementModel.date.getDate(), 
                        measurementModel.date.getHours(), 0, 0, 0)
    };

    var d = new Date();
    d = new Date( d.getFullYear(), 
                        d.getMonth(),
                        d.getDate(), 
                        d.getHours(), 0, 0, 0);

    HourlyMeasurement.findOne(  filter, 
                                function(err, hourly) {
                                    if (err)
                                        return;
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
                                    var now = new Date();
                                    var durationDelta;
                                    if (hourly.last_measurement_date)
                                        durationDelta = (now.getTime() - hourly.last_measurement_date.getTime())/1000;
                                    else
                                        durationDelta = (now.getTime() - d.getTime())/1000;
                                    
                                    hourly.duration += durationDelta;
                                    hourly.cumul_value += measurementModel.value * durationDelta;
                                    hourly.last_measurement_date = now;
                                    hourly.save();
                                });

}

function SaveTemperature2(sensorID, temperatureC, date, successFn, errorFn) {

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

    SaveMeasurement2(measurement, successFn, errorFn);
}



function GetLastTemperature2(sensorID, successFn, errorFn) {
    if (!sensorID)
        errorFn("invalid sensorID");

    RawMeasurement.find({sensor_id: sensorID, measurement_type: "temperature"})
                  .limit(1)
                  .sort("-date")
                  .exec(function(err, temperatureMeasurement) {
                    if (err)
                        errorFn(err);
                    else
                        successFn(temperatureMeasurement)
                  });
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

function GetRawMeasurementByDates2(sensorID, measurementType, startDate, endDate, successFn, errorFn) {
    
    var filter = {
        measurement_type: measurementType,
        sensor_id: sensorID,
    };

    if (startDate || endDate)

    if (startDate && endDate)
        filter.date = { $gte: startDate, $lte: endDate };
    else if (startDate && !endDate)
        filter.date = { $gte: startDate };
    else if (!startDate && endDate)
        filter.date = { $lte: endDate };

    RawMeasurement  .find(filter)
                    .exec(function(err, measurements) {
                        if (err)
                            errorFn(err);
                        else
                            successFn(measurements);
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

/*
CreateSensor2({ 
    sensor_id:2,
    location: 'outside, above front door',
    name: 'Sensor Front',
    description: 'multisensor',
    capabilities: ['temperature', 'humidity', 'luminosity']
}, function success() {
    console.log("sensor created");
}, function error(errMessage) {
    console.log(errMessage);
} ); //*/

//RemoveSensor2(2, function success() {}, function err(error) {console.log(error);});

/*
UpdateSensor2({ 
    sensor_id:2,
    location: 'outside, above front door',
    name: 'Frontdoor multi-Sensor',
    description: 'multisensor',
    capabilities: ['temperature', 'humidity', 'luminosity']
}, function success() {
    console.log("sensor created");
}, function error(errMessage) {
    console.log(errMessage);
} );
*/

//GetSensor2(2, function success(sensor) {
//    console.log(sensor);
//}, function err(msg) {
//    console.log(msg);
//});

/*
SaveTemperature2(2, 18.5, new Date(), function() {
    console.log("temperature added");
}, function(err) {
    console.log(err);
}); 
//*/

//GetLastTemperature2(2, function(m) { console.log(m); }, function(err) { console.log(err); });
//*
GetRawMeasurementByDates2(  2, 
                            "temperature",
                            null, 
                            null,
                            function(m) { console.log(m); }, function(err) { console.log(err); });

//*/
/*
RemoveRawMeasurementOlderThan(  2,
                                "temperature",
                                null,
                                function() { console.log("remove successful"); }, function(err) { console.log(err); });
//*/

GetHourlyTemperatures2(2, function success(m) {
    console.log(m);
}, function error(err) {
    console.log(err);
});

//RemoveHourlyMeasurementOlderThan(2, "temperature", null, function() {}, function() {});

// --


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

function GetTemperaturesForSensor(sensorID, options, successFn, errorFn) {

    var result = {};

    var filter = FilterFromOptions(options, sensorID);

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

    var filter = FilterFromOptions(options, sensorID);

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

    var filter = FilterFromOptions(options, sensorID);

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

exports.GetSensor2 = GetSensor2;
exports.CreateSensor2 = CreateSensor2;
exports.RemoveSensor2 = RemoveSensor2;
exports.UpdateSensor2 = UpdateSensor2;
exports.SaveTemperature2 = SaveTemperature2;