function CurrentHumidityCtrl($scope, $routeParams, $http) {

    $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode('seb:password'); 
    $http.get("/api/humidity/" + $routeParams.sensorID + "?numberPoints=1", {})
        .success(function(data, status, headers, config) {
            $scope.currentValue = data.humidity[0];
        })
        .error(function(data, status, headers, config) {
            $scope.status = data;
        });
}
