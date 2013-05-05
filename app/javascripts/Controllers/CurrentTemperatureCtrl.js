function CurrentTemperatureCtrl($scope, $routeParams, $http) {

    $scope.isLoading = true;

    $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode('seb:password'); 
    $http.get("/api/temperature/raw/" + $routeParams.sensorID + "?numberPoints=1", {})
        .success(function(data, status, headers, config) {
            $scope.currentValue = data.values[0];
            $scope.isLoading = false;
        })
        .error(function(data, status, headers, config) {
            $scope.status = data;
            $scope.isLoading = false;
        });

}
