var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var storage = require('./FRDDomoticsStorage.js');

// cleanup the mongoDB.


storage.RemoveHourlyMeasurementOlderThan(2, "temperature", null, function() {}, function() {});
storage.RemoveHourlyMeasurementOlderThan(2, "humidity", null, function() {}, function() {});
storage.RemoveHourlyMeasurementOlderThan(2, "luminosity", null, function() {}, function() {});

storage.RemoveRawMeasurementOlderThan(2, "temperature", null, function() {}, function() {});
storage.RemoveRawMeasurementOlderThan(2, "humidity", null, function() {}, function() {});
storage.RemoveRawMeasurementOlderThan(2, "luminosity", null, function() {}, function() {});

storage.RemoveSensor2(2, function() {}, function() {});

// migrate sensors
storage.GetAllSensors(function success(sensors) {
        _.each(sensors, function migrateSensor(sensor) {
            console.log("migrating sensor " + sensor.name);
            var mongoSensor =   {
                                    sensor_id: sensor.sensor_id,
                                    name: sensor.name,
                                    description: sensor.name,
                                    location: sensor.location,
                                    capabilities: ["temperature", "humidity", "luminosity"]
                                };
            storage.CreateSensor2(mongoSensor, function success() {
                console.log("success");
            }, function error(err){
                console.log("Err " + err);
            });
        });
    },
    function error(err) {
        console.log(err);
    });   

// migrate raw temperature records
storage.GetTemperatureForSensor( 2, 
                                { }, 
                                function success(result) {

                                    var initialDate = result.oldest_measurement_date.getTime();
                                    var sensor_id = result.sensorID;
                                    
                                    _.each(result.temperatures, function(val, index) {
                                        var date = new Date(initialDate + result.date_offset[index] * 1000);

                                        storage.SaveTemperature2(   sensor_id, 
                                                                    val, 
                                                                    date, 
                                                                    false,
                                                                    function success() {
                                                                        
                                                                    }, function errorFn(err) {
                                                                        console.log("failed to migrate temperature " + err);
                                                                    });
                                    });
                                    // save hourly records...
                                    var dateRecords = {};

                                    for (var index in result.temperatures) {
                                        var date = new Date(initialDate + result.date_offset[index] * 1000);
                                        var roundDate = storage.GetHourBoundaryDate(date);
                                        var val = result.temperatures[index];
                                        

                                        if (!dateRecords[roundDate]) {
                                            // first value recorded for this hour.
                                            var duration = (date.getTime() - roundDate.getTime()) / 1000;

                                            dateRecords[roundDate] = {
                                                sensor_id: result.sensorID,
                                                measurement_type: "temperature",
                                                date: roundDate,
                                                cumul_value: duration * val,
                                                min_value: val,
                                                max_value: val,
                                                duration: duration,
                                                last_measurement_date: date
                                            };
                                        } else {
                                            // we just need to update the record for this guy
                                            var duration = (date.getTime() - dateRecords[roundDate].last_measurement_date.getTime()) / 1000;
                                            dateRecords[roundDate].cumul_value +=  duration * val;
                                            dateRecords[roundDate].min_value = Math.min(dateRecords[roundDate].min_value, val);
                                            dateRecords[roundDate].max_value = Math.max(dateRecords[roundDate].max_value, val);
                                            dateRecords[roundDate].duration += duration;
                                            dateRecords[roundDate].last_measurement_date = date;
                                        }
                                    }
                                    
                                    _.each(dateRecords, function(record) {
                                        
                                        storage.SaveHourlyMeasurement(  record.sensor_id, 
                                                                        record.measurement_type, 
                                                                        record.date, 
                                                                        record.cumul_value, 
                                                                        record.min_value, 
                                                                        record.max_value, 
                                                                        record.duration,
                                                                        record.last_measurement_date);
                                    });
                                },
                                function error(err) {
                                    console.log("Failed to get temperature. " + err);
                                }
);


// migrate raw humidity records
storage.GetHumidityForSensor( 2, 
                                { }, 
                                function success(result) {
                                    var initialDate = result.oldest_measurement_date.getTime();
                                    var sensor_id = result.sensorID;

                                    // save raw records...
                                    _.each(result.humidity, function(val, index) {
                                        var date = new Date(initialDate + result.date_offset[index] * 1000);
                                        storage.SaveHumidity2(  sensor_id, 
                                                                val, 
                                                                date, 
                                                                false,
                                                                function success() {
                                                                    
                                                                }, function errorFn(err) {
                                                                    console.log("failed to migrate humidity " + err);
                                                                });
                                    });
                                    // save hourly records...
                                    var dateRecords = {};

                                    for (var index in result.humidity) {
                                        var date = new Date(initialDate + result.date_offset[index] * 1000);
                                        var roundDate = storage.GetHourBoundaryDate(date);
                                        var val = result.humidity[index];

                                        if (!dateRecords[roundDate]) {
                                            // first value recorded for this hour.
                                            var duration = (date.getTime() - roundDate.getTime()) / 1000;

                                            dateRecords[roundDate] = {
                                                sensor_id: result.sensorID,
                                                measurement_type: "humidity",
                                                date: roundDate,
                                                cumul_value: duration * val,
                                                min_value: val,
                                                max_value: val,
                                                duration: duration,
                                                last_measurement_date: date
                                            };
                                        } else {
                                            // we just need to update the record for this guy
                                            var duration = (date.getTime() - dateRecords[roundDate].last_measurement_date.getTime()) / 1000;
                                            dateRecords[roundDate].cumul_value +=  duration * val;
                                            dateRecords[roundDate].min_value = Math.min(dateRecords[roundDate].min_value, val);
                                            dateRecords[roundDate].max_value = Math.max(dateRecords[roundDate].max_value, val);
                                            dateRecords[roundDate].duration += duration;
                                            dateRecords[roundDate].last_measurement_date = date;
                                        }
                                    }
                                    
                                    _.each(dateRecords, function(record) {
                                        
                                        storage.SaveHourlyMeasurement(  record.sensor_id, 
                                                                        record.measurement_type, 
                                                                        record.date, 
                                                                        record.cumul_value, 
                                                                        record.min_value, 
                                                                        record.max_value, 
                                                                        record.duration,
                                                                        record.last_measurement_date);
                                    });
                                },
                                function error(err) {
                                    console.log("Failed to get humidity. " + err);
                                }
);

// migrate raw luminosity records
storage.GetLuminosityForSensor( 2, 
                                { }, 
                                function success(result) {
                                    var initialDate = result.oldest_measurement_date.getTime();
                                    var sensor_id = result.sensorID;

                                    // save raw records...
                                    _.each(result.luminosity, function(val, index) {
                                        var date = new Date(initialDate + result.date_offset[index] * 1000);
                                        storage.SaveLuminosity2(sensor_id, 
                                                                val, 
                                                                date, 
                                                                false,
                                                                function success() {

                                                                }, function errorFn(err) {
                                                                    console.log("failed to migrate luminosity " + err);
                                                                });
                                    });
                                    // save hourly records...
                                    var dateRecords = {};

                                    for (var index in result.luminosity) {
                                        var date = new Date(initialDate + result.date_offset[index] * 1000);
                                        var roundDate = storage.GetHourBoundaryDate(date);
                                        var val = result.luminosity[index];

                                        if (!dateRecords[roundDate]) {
                                            // first value recorded for this hour.
                                            var duration = (date.getTime() - roundDate.getTime()) / 1000;

                                            dateRecords[roundDate] = {
                                                sensor_id: result.sensorID,
                                                measurement_type: "luminosity",
                                                date: roundDate,
                                                cumul_value: duration * val,
                                                min_value: val,
                                                max_value: val,
                                                duration: duration,
                                                last_measurement_date: date
                                            };
                                        } else {
                                            // we just need to update the record for this guy
                                            var duration = (date.getTime() - dateRecords[roundDate].last_measurement_date.getTime()) / 1000;
                                            dateRecords[roundDate].cumul_value +=  duration * val;
                                            dateRecords[roundDate].min_value = Math.min(dateRecords[roundDate].min_value, val);
                                            dateRecords[roundDate].max_value = Math.max(dateRecords[roundDate].max_value, val);
                                            dateRecords[roundDate].duration += duration;
                                            dateRecords[roundDate].last_measurement_date = date;
                                        }
                                    }
                                    
                                    _.each(dateRecords, function(record) {
                                        
                                        storage.SaveHourlyMeasurement(  record.sensor_id, 
                                                                        record.measurement_type, 
                                                                        record.date, 
                                                                        record.cumul_value, 
                                                                        record.min_value, 
                                                                        record.max_value, 
                                                                        record.duration,
                                                                        record.last_measurement_date);
                                    });
                                },
                                function error(err) {
                                    console.log("Failed to get luminosity. " + err);
                                }
);

