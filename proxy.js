var https = require('https')
  , http = require('http')
  , util = require('util')
  , colors = require('colors')
  , httpProxy = require('http-proxy')
  , fs = require('fs')
  , path = require('path')
  , request = require('request')
  , storage = require('./FRDDomoticsStorage.js')
  , static = require('node-static')
  , frdApn = require('./FRDDomoticsAPN.js')
  , rulesEngine = require('./FRDDomoticsRulesEngine.js')
  ;

var proxyPort = 8000;
var wwwPort = 8080;
var apiPort = 8081;


var options = {
    https: {
        key: fs.readFileSync(path.resolve(__dirname, 'crypto/key.pem'), 'utf8'),
        cert: fs.readFileSync(path.resolve(__dirname, 'crypto/certificate.pem'), 'utf8')
    },
    pathnameOnly: true,
    router: {
        '/api':  '127.0.0.1:' + apiPort,
        '': '127.0.0.1:' + wwwPort
    }
};


//
// Create the proxy server listening on port 443
//
httpProxy.createServer(options).listen(8000);

// the actual web server
var file = new(static.Server)('./app');
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        // Serve files!
        file.serve(request, response);
    });
}).listen(wwwPort);


util.puts('https proxy server'.blue + ' started '.green.bold + 'on port '.blue + ('' + proxyPort).yellow);

util.puts('proxy routing:'.white.bold);
util.puts('https://host:' + (proxyPort + '').red.bold + '/' + 'api/{path}'.green.bold + ' -> http://host:' + (apiPort + '').red.bold + '/'+ '{path}'.green.bold);
util.puts('https://host:' + (proxyPort + '').red.bold + '/' + '{path}'.green.bold + ' -> http://host:' + (wwwPort + '').red.bold + '/' + '{path}'.green.bold);


var lastMeasurementDate = null;

function requestData(timeStamp) {
    lastMeasurementDate = new Date(timeStamp * 1000);
    request.post(   'http://192.168.0.111:8083/ZWaveAPI/Data/' + timeStamp,
                    {},
                    handleAnswer);  
}

function handleAnswer(error, response, body) {
    
    if (!error && response.statusCode == 200) {    
        var obj = JSON.parse(body);

        for (key in obj) {
            // is it a multi-sensor?
            // starts with devices.{deviceID}}.instances.0.commandClasses.49.data
            var regEx = new RegExp(/^devices\.([0-9]+)\.instances\.0\.commandClasses\.49\.data/);
            var match = regEx.exec(key);
            if (match && match[1]) {

                var sensorID = match[1];
                console.log('sensorID: ' + sensorID);
                var data = obj[key];
                if (data.sensorTypeString) {
                    switch (data.sensorTypeString.value) {
                        case 'Temperature':
                            storage.SaveTemperature2(sensorID,
                                                    data.val.value,
                                                    lastMeasurementDate,
                                                    true,
                                                    function success() {
                                                        console.log('temperature saved' );
                                                    },
                                                    function error(err) {
                                                        console.log('temperature could not be saved. ' + err);
                                                    });
                            break;
                        case 'Luminiscence':
                            storage.SaveLuminosity2( sensorID,
                                                    data.val.value,
                                                    lastMeasurementDate,
                                                    true,
                                                    function success() {
                                                        console.log('luminosity saved ');
                                                    },
                                                    function error(err) {
                                                        console.log('luminosity could not be saved. ' + err);
                                                    });
                            break;
                        case 'Humidity':
                            storage.SaveHumidity2(   sensorID,
                                                    data.val.value,
                                                    lastMeasurementDate,
                                                    true,
                                                    function success() {
                                                        console.log('humidity saved ');
                                                    },
                                                    function error(err) {
                                                        console.log('humidity could not be saved. ' + err);
                                                    });
                            break;
                    }
                }
            }

            // is it a level?
            // starts with devices.{deviceID}}.instances.0.commandClasses.48.data.level
            regEx = new RegExp(/^devices\.([0-9]+)\.instances\.0\.commandClasses\.48\.data\.level/);
            match = regEx.exec(key);
            if (match) {
                var sensorID = match[1];

                console.log('level sensorID: ' + sensorID);
                var data = obj[key];

                var getSensor = storage.GetSensor2(sensorID);
                
                getSensor
                    .then(  function(sensorData) {
                                if (!sensorData || sensorData.length == 0) {
                                    var p = storage.CreateSensor({
                                        sensor_id: sensorID,
                                        name: "level " + sensorID,
                                        description: "level sensor",
                                        location: "unknown",
                                        capabilities: ["level"]
                                    });
                                    return p;
                                }
                            })
                    .then(  function() {
                                // ok here we know we have a sensor in the db,
                                // add a row to record the change that was just triggered...
                                storage.SaveLevelChange(sensorID, new Date(), data.value);
                                console.log("level " + sensorID + " is now " + data.value);
                                rulesEngine.evaluateLevelRulesForSensor(sensorID, function(evalResult) {
                                    if (evalResult.isMatch)
                                        console.log(evalResult);

                                    frdApn.sendApnNotification({
                                        'alert': evalResult.message,
                                        'sensor_id': sensorID,
                                        'measurement_type': evalResult.measurement_type,
                                    });
                                });
                            },
                            function(err) {
                                console.log("level " + sensorID + " " + err);
                            }
                    );              
                
            }
        }
        setTimeout(function () {
                        requestData(obj.updateTime);
                    }, 1000);
    }
}


var timeStamp = Math.floor((new Date()).getTime() / 1000);
requestData(timeStamp);
