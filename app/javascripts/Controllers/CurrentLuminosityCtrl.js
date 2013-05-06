function CurrentLuminosityCtrl($scope, $routeParams, $http) {

    $scope.isLoading = true;

    $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode('seb:password'); 
    $http.get("/api/luminosity/raw/" + $routeParams.sensorID + "?numberPoints=1", {})
        .success(function(data, status, headers, config) {
            $scope.currentValue = data.values[0];
            $scope.isLoading = false;
            $scope.currentValue = data.values[0];
            var m = moment(data.most_recent_measurement_date);
            $scope.date = m.fromNow();
        })
        .error(function(data, status, headers, config) {
            $scope.status = data;
            $scope.isLoading = false;
        });
}
