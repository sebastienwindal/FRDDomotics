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
  , request = require('request');


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


var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('FRDDomotics.db');
console.log(db);

function requestData(timeStamp) {

  request.post( 'http://192.168.0.111:8083/ZWaveAPI/Data/' + timeStamp,
              {},
              handleAnswer);  
}

function handleAnswer(error, response, body) {
  if (!error && response.statusCode == 200) {    
    var obj = JSON.parse(body);
    console.log(obj);
    setTimeout(function () {
                  requestData(obj.updateTime);
              }, 10000);
  }
}

requestData('1367507213');