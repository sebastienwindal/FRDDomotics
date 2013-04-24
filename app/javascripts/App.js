var app = angular.module('FRDDomoticsApp', []);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/temperature/:sensorID', {templateUrl: 'partials/temperature.html',   controller: TemperatureCtrl }).
      when('/luminosity/:sensorID', {templateUrl: 'partials/luminosity.html', controller: LuminosityCtrl }).
      when('/humidity/:sensorID', {templateUrl: 'partials/humidity.html', controller: HumidityCtrl }).
      when('/sensors', {templateUrl: 'partials/sensors.html', controller: SensorsCtrl }).
      otherwise({redirectTo: '/404'});
}]);
