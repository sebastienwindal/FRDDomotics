var restify = require('restify');
var _ = require('underscore');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var storage = require('./FRDDomoticsStorage.js');


function about(req, res, next) {

    var data = {    name: server.name, 
                    versions: server.versions, 
                    startDate: startDate,
                    nodeVersion: process.version };

    if (!req.params.option) {
        res.send(data);
        return next();
    }

    _.each(data, function(val,key) {
        if (key === req.params.option) {
            var partialData = {};
            partialData[req.params.option] = val;
            res.send(partialData);
            return next();
        }
    });

    return next(new restify.BadRequestError("unknown argument '" + req.params.option + "'"));
}


function status(req, res, next) {
    storage.GetStats(function success(stats) {
	res.send({ stats: stats });
	return next();	
    }, function error(err) {
	res.send({error: err});
	return next();
    });
}


function getOptionsFromQueryString(req) {
    
    var options = {};

    if (req.params.numberPoints) {
        options.numberPoints = req.params.numberPoints;
    }
    if (req.params.startDate) {
        options.startDate = req.params.startDate;
    }
    if (req.params.endDate) {
        options.endDate = req.params.endDate;
    }
    if (req.params.timeSpan) {
        options.timeSpan = req.params.timeSpan;
    }
    return options;
}


// complete
function getTemperature(req, res, next) {

    var options = getOptionsFromQueryString(req);

    storage.GetRawMeasurement(  req.params.sensorID, 
                                "temperature", 
                                options,
                                function success(data) {
                                    res.send(data);
                                    next();
                                },
                                function error(err) {
                                    return next(new restify.BadRequestError(err));
                                });
}


function getLastTemperatureForSensor(req, res, next)
{
    storage.GetLastValueForSensor(   "temperature",
                            req.params.sensorID, 
                            function success(result) {
                                res.send(result);
                                next();
                            }, 
                            function error(err) {
                                return next(new restify.BadRequestError(err));
                            });
}

function getLastHumidityForSensor(req, res, next)
{
    storage.GetLastValueForSensor(   "humidity",
                            req.params.sensorID, 
                            function success(result) {
                                res.send(result);
                                next();
                            }, 
                            function error(err) {
                                return next(new restify.BadRequestError(err));
                            });
}

function getLastLuminosityForSensor(req, res, next)
{
    storage.GetLastValueForSensor(   "luminosity",
                            req.params.sensorID, 
                            function success(result) {
                                res.send(result);
                                next();
                            }, 
                            function error(err) {
                                return next(new restify.BadRequestError(err));
                            });
}

function getHourlyTemperature(req, res, next) {
    var options = getOptionsFromQueryString(req);

    storage.GetHourlyMeasurement(  req.params.sensorID, 
                                    "temperature", 
                                    options,
                                    function success(data) {
                                        res.send(data);
                                        next();
                                    },
                                    function error(err) {
                                        return next(new restify.BadRequestError(err));
                                    });
}


function getHourlyHumidity(req, res, next) {
    var options = getOptionsFromQueryString(req);

    storage.GetHourlyMeasurement(  req.params.sensorID, 
                                    "humidity", 
                                    options,
                                    function success(data) {
                                        res.send(data);
                                        next();
                                    },
                                    function error(err) {
                                        return next(new restify.BadRequestError(err));
                                    });
}


function getHourlyLuminosity(req, res, next) {
    var options = getOptionsFromQueryString(req);

    storage.GetHourlyMeasurement(  req.params.sensorID, 
                                    "luminosity", 
                                    options,
                                    function success(data) {
                                        res.send(data);
                                        next();
                                    },
                                    function error(err) {
                                        return next(new restify.BadRequestError(err));
                                    });
}

// complete
function getHumidity(req, res, next) {

    var options = getOptionsFromQueryString(req);

    storage.GetRawMeasurement(  req.params.sensorID, 
                                "humidity", 
                                options,
                                function success(data) {
                                    res.send(data);
                                    next();
                                },
                                function error(err) {
                                    return next(new restify.BadRequestError(err));
                                });
}

// complete
function getLuminosity(req, res, next) {

    var options = getOptionsFromQueryString(req);

    storage.GetRawMeasurement(  req.params.sensorID, 
                                "luminosity", 
                                options,
                                function success(data) {
                                    res.send(data);
                                    next();
                                },
                                function error(err) {
                                    return next(new restify.BadRequestError(err));
                                });
}


function getLastTemperature(req, res, next) {

    storage.GetLastValueForAllSensors("temperature", function successFn(data) {
        res.send(data);
        next();
    }, 
    function error(err) {
        return next(new restify.BadRequestError(err));
    });
}

function getLastLuminosity(req, res, next) {

    storage.GetLastValueForAllSensors("luminosity", function successFn(data) {
        res.send(data);
        next();
    }, 
    function error(err) {
        return next(new restify.BadRequestError(err));
    });
}

function getLastHumidity(req, res, next) {

    storage.GetLastValueForAllSensors("humidity", function successFn(data) {
        res.send(data);
        next();
    }, 
    function error(err) {
        return next(new restify.BadRequestError(err));
    });
}

// complete
function getAllSensors(req, res, next) {
    
    storage.GetAllSensors2(function success(data) {
        res.send(data);
        next();
    },
    function error(err) {
        return next(new restify.BadRequestError(err));
    });   
}

// complete
function getSensor(req, res, next) {
    storage.GetSensor2(  req.params.sensorID,
                        function success(data) {
                            res.send(data);
                            next();
                        },
                        function error(err) {
                            return next(new restify.BadRequestError(err));
                        });   

}


function updateSensor(req, res, next) {

    storage.UpdateSensor2(  req.params.sensorID,
                            req.body,
                            function success(data) {
                                res.send(data);
                                next();
                            },
                            function error(err) {
                                return next(new restify.BadRequestError(err));
                            });
}

function wrongRoute(req, res, next) {
    return next(new restify.ResourceNotFoundError(req.path() + " does not exist."));
}

var server = restify.createServer({
    name: 'FRDDomoticsAPI',
    version: '0.1.0'
});

server.use(restify.authorizationParser());
server.use(restify.bodyParser({ mapParams: false }));
server.use(function authenticate(req, res, next) {

    if (!req || 
        !req.authorization || 
        !req.authorization.basic || 
        !req.authorization.basic.username || 
        !req.authorization.basic.password)
        return next(new restify.NotAuthorizedError());

    // see if we have a user with associated with the user name passed in req.authorization
    var userpath = path.resolve(__dirname, 'users/' + req.authorization.basic.username + '.pwd');
    if (!fs.existsSync(userpath)) 
        return next(new restify.NotAuthorizedError());;

    var hashedPwd = fs.readFileSync(userpath, 'ascii').replace(/\s/g, '');
    
    // compute the sha 512 hash of the user password
    var strToHash = 'FRDDomotics-' + req.authorization.basic.username + req.authorization.basic.password;
    var shasum = crypto.createHash('sha512');
    shasum.update(strToHash);

    if (shasum.digest('hex') != hashedPwd) {
        return next(new restify.NotAuthorizedError());;
    }
    return next();
});

server.use(restify.queryParser());


server.get('/about', about);
server.get('/about/:option', about);
server.get('/sensors', getAllSensors);
server.get('/sensor/:sensorID', getSensor);
server.put('/sensor/:sensorID', updateSensor);

server.get('/temperature/raw/:sensorID', getTemperature);
server.get('/humidity/raw/:sensorID', getHumidity);
server.get('/luminosity/raw/:sensorID', getLuminosity);

server.get('/temperature/hourly/:sensorID', getHourlyTemperature);
server.get('/humidity/hourly/:sensorID', getHourlyHumidity);
server.get('/luminosity/hourly/:sensorID', getHourlyLuminosity);

server.get('/temperature/last/:sensorID', getLastTemperatureForSensor);
server.get('/humidity/last/:sensorID', getLastHumidityForSensor);
server.get('/luminosity/last/:sensorID', getLastLuminosityForSensor);

server.get('/temperature/last', getLastTemperature);
server.get('/humidity/last', getLastHumidity);
server.get('/luminosity/last', getLastLuminosity);


server.get('/status', status);

server.get(/./, wrongRoute);

var startDate = new Date();

server.listen(8081, function() {
  console.log('%s listening at %s', server.name, server.url);
});
