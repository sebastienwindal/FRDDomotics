var app = angular.module('FRDDomoticsApp', []);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/temperature/history/:sensorID', {templateUrl: 'partials/temperature.html',   controller: TemperatureCtrl }).
      when('/luminosity/history/:sensorID', {templateUrl: 'partials/luminosity.html', controller: LuminosityCtrl }).
      when('/humidity/history/:sensorID', {templateUrl: 'partials/humidity.html', controller: HumidityCtrl }).

      when('/temperature/:sensorID', {templateUrl: 'partials/curtemperature.html',   controller: CurrentTemperatureCtrl }).
      when('/luminosity/:sensorID', {templateUrl: 'partials/curluminosity.html', controller: CurrentLuminosityCtrl }).
      when('/humidity/:sensorID', {templateUrl: 'partials/curhumidity.html', controller: CurrentHumidityCtrl }).

      when('/sensors', {templateUrl: 'partials/sensors.html', controller: SensorsCtrl }).
      otherwise({redirectTo: '/404'});
}]);
