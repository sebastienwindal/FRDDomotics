var https = require('https')
  , http = require('http')
  , util = require('util')
  , colors = require('colors')
  , httpProxy = require('http-proxy')
  , fs = require('fs')
  , express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , path = require('path')
  , request = require('request')
  , Sequelize = require("sequelize")
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


var app = express();

app.configure(function(){
  app.set('port', wwwPort);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.enable('trust proxy');

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);


//
// Create the target HTTPS server 
//
http.createServer(app).listen(app.get('port'), function(){
  util.puts('Express server '.blue + 'started '.green.bold + 'on port '.blue + ('' + wwwPort).yellow);  
});

util.puts('https proxy server'.blue + ' started '.green.bold + 'on port '.blue + ('' + proxyPort).yellow);

util.puts('proxy routing:'.white.bold);
util.puts('https://host:' + (proxyPort + '').red.bold + '/' + 'api/{path}'.green.bold + ' -> http://host:' + (apiPort + '').red.bold + '/'+ '{path}'.green.bold);
util.puts('https://host:' + (proxyPort + '').red.bold + '/' + '{path}'.green.bold + ' -> http://host:' + (wwwPort + '').red.bold + '/' + '{path}'.green.bold);


var sequelize = new Sequelize('FRDDomotics', '', '', {
  dialect: 'sqlite',
  storage: 'FRDDomotics.db'
})

// create an object we can use to manipulate data in the Temperature table.
var TemperatureMeasurement = sequelize.define('Temperature', {
  row_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  sensor_id: Sequelize.INTEGER,
  measurement_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  value: { type: Sequelize.FLOAT, allowNull: false }
}, {
  // don't add the timestamp attributes (updatedAt, createdAt)
  timestamps: false
});

var temperatureRow = TemperatureMeasurement.build(
                      {
                        sensor_id: 99999, 
                        measurement_date: new Date(),
                        value: 20.3 
                      });
//temperatureRow.save()
//  .success(function(temperature) {
//    console.log("success!");
//  }).error(function(error) {
//  });

var lastMeasurementDate = null;

function requestData(timeStamp) {
  lastMeasurementDate = new Date(timeStamp * 1000);
  request.post( 'http://192.168.0.111:8083/ZWaveAPI/Data/' + timeStamp,
              {},
              handleAnswer);  
}

function handleAnswer(error, response, body) {
  if (!error && response.statusCode == 200) {    
    var obj = JSON.parse(body);
    for (key in obj) {
	var regEx = new RegExp(/^devices\.([0-9]+)\.instances\.0\.commandClasses\.49\.data/);
	var match = regEx.exec(key);
        if (match && match[1]) {
		var sensorID = match[1];
		console.log('sensorID: ' + sensorID);
		var data = obj[key];
		if (data.sensorTypeString) {
			switch (data.sensorTypeString.value) {
				case 'Temperature':
					console.log('Temperature: ' + data.val.value);	
				var temperatureRow = TemperatureMeasurement.build(
                      {
                        sensor_id: sensorID,
                        measurement_date: lastMeasurementDate,
                        value: data.val.value
                      });
temperatureRow.save()
  .success(function(temperature) {
    console.log("success!");
  }).error(function(error) {
	console.log(error);
  });
					break;
				case 'Luminiscence':
					console.log('Luminiscence: ' + data.val.value);
					break;
				case 'Humidity':
					console.log('Humidity: ' + data.val.value);
					break;
			}
		}
	}
    }
    setTimeout(function () {
                  requestData(obj.updateTime);
              }, 10000);
  }
}

requestData('1367507213');
