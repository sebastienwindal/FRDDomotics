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

var sensorList = [ {   type: 'temperature',
                    id: '1', 
                    name: 'on board sensor 1',
                    description: '',
                    location: 'living room'
                },
                {   type: 'temperature',
                    id: '2', 
                    name: 'outside sensor',
                    description: '',
                    location: 'patio'
                },
                {   type: 'humidity',
                    id: '3', 
                    name: 'outside humidity sensor',
                    description: '',
                    location: 'patio'
                }
                ];


function sensors(req, res, next) {

    if (!req.params.sensorID) {
        var list = sensorList;
        if (req.params.type) {
            list = _.where(sensorList, { type: req.params.type });
        }
        res.send(list);
        res.next();        
    }

    var sensorSublist = _.where(sensorList, { id: req.params.sensorID });
    if (sensorSublist.length == 0) {
        return next(new restify.BadRequestError("no sensor with id '" + req.params.sensorID + "'"));
    }
    res.send(sensorSublist[0]);
    res.next();
}

function temperature(req, res, next) {

    // double check the sensor exist
    var list = _.where(sensorList, { id: req.params.sensorID, type: 'temperature' });

    if (list.length == 0) {
        return next(new restify.BadRequestError("no temperature sensor with id '" + req.params.sensorID + "'"));
    }

    storage.GetTemperaturesForSensor(2, 50, 
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
server.get('/sensors', sensors);
server.get('/sensors/:sensorID', sensors);
server.get('/temperature/:sensorID', temperature);
server.get(/./, wrongRoute);

var startDate = new Date();

server.listen(8081, function() {
  console.log('%s listening at %s', server.name, server.url);
});
