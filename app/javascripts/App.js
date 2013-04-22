var app = angular.module('FRDDomoticsApp', []);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/q', {templateUrl: 'partials/index.html',   controller: MainCtrl }).
      otherwise({redirectTo: '/404'});
}]);