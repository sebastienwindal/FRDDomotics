function CurrentHumidityCtrl($scope, $routeParams, $http) {

    $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode('seb:password'); 
    $scope.isLoading = true;
    $http.get("/api/humidity/raw/" + $routeParams.sensorID + "?numberPoints=1", {})
        .success(function(data, status, headers, config) {
            $scope.isLoading = false;
            $scope.currentValue = data.values[0];
        })
        .error(function(data, status, headers, config) {
            $scope.isLoading = false;
            $scope.status = data;
        });
}
