
var storage = require('./FRDDomoticsStorage.js');

function evaluateLevelRulesForSensor(sensorID, ruleEvalCompleteCallback) {

    storage.GetRawMeasurement(  sensorID, 
                                "level", 
                                { numberPoints: 2 },
                                function success(data) {
                                    if (!data.values || data.values.length < 2) {
                                        ruleEvalCompleteCallback({ isMatch: false });
                                        return;
                                    }

                                    if (data.values[0] == data.values[1]) {
                                        // no change
                                        ruleEvalCompleteCallback({ isMatch: false });
                                        return;
                                    }

                                    // the state of the door/window changed!
                                    storage.GetSensor2(sensorID, function(sensor) {
                                        var result = {
                                            isMatch: true,
                                            sensor: sensor,
                                            isOpen: (data.values[1] == 1),
                                            eventDate: data.most_recent_measurement_date,
                                            measurement_type: 'level',
                                            message: sensor.name + " is now " + ((data.values[1] == 1) ? "open." : "close")
                                        };
                                        ruleEvalCompleteCallback(result);
                                    }, function(err) {
                                        ruleEvalCompleteCallback({ isMatch: false });
                                    });
                                },
                                function error(err) {
                                    // ignore...
                                    console.log(err);
                                    ruleEvalCompleteCallback({ isMatch: false });
                                });

}


exports.evaluateLevelRulesForSensor = evaluateLevelRulesForSensor;