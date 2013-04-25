function SensorsCtrl($scope, $http, $location) {
 
    $scope.isLoading = true;

    $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode('seb:password'); 
    $http.get("/api/sensors", {})
        .success(function(data, status, headers, config) {
            $scope.sensors = data;
            $scope.isLoading = false;
        })
        .error(function(data, status, headers, config) {
            $scope.status = data;
            $scope.isLoading = false;
        });

    $scope.showTemperature = function(sensor) {
        $location.path("/temperature/" + sensor.sensor_id);
    };

    $scope.showHumidity = function(sensor) {
        $location.path("/humidity/" + sensor.sensor_id);
    };
    
    $scope.showLuminosity = function(sensor) {
        $location.path("/luminosity/" + sensor.sensor_id);
    };
}

