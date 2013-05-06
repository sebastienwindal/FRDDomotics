function SensorCalendarCtrl($scope, $routeParams, $http) {

    $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode('seb:password'); 
    $scope.isLoading = true;
    $scope.DayOfDate = function(date) {
        return new Date(date.getYears(),
                        date.getMonth(),
                        date.getDate(),
                        0, 0, 0, 0);
    }
    $http.get("/api/temperature/hourly/" + $routeParams.sensorID , {})
        .success(function(data, status, headers, config) {

            var dayStats = {};

            for (index in data.values) {
                
            }


            $scope.isLoading = false;
            
            $scope.days = [ {
                min: 10, 
                max: 15,
                avg: 12.5,
                date: new Date()
            },
            {
                min: 11, 
                max: 19,
                avg: 15,
                date: new Date()
            }]
        })
        .error(function(data, status, headers, config) {
            $scope.isLoading = false;
            $scope.status = data;
        });
}
