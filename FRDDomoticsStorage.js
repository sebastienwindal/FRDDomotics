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

    TemperatureMeasurement  .findAll({  where: ['sensor_id=?', sensorID],
                                        order: 'measurement_date DESC', 
                                        limit: 1})
                            .success(function(temp) {
				if (temp.length > 0)
                                	successFn(temp[0].selectedValues);
				else
					successFn({});
                            })
			    .error(function(err) {
				errorFn(err);	
			    });
}


exports.SaveLuminosity = SaveLuminosity;
exports.SaveHumidity = SaveHumidity;
exports.SaveTemperature = SaveTemperature;
exports.GetLastTemperatureForSensor = GetLastTemperatureForSensor;
