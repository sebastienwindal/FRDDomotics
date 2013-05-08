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
            var m = moment(data.oldest_measurement_date); 
            for (index in data.min_values) {
                var m2 = moment(m);
                m2.add('hours', data.hour_offset[index]);
                m2.startOf('day'); 
                if (!dayStats[m2]) {
                    dayStats[m2] = {    min: data.min_values[index],
                                        max: data.max_values[index]
                                    };
                } else {
                    dayStats[m2].min = Math.min(dayStats[m2].min, data.min_values[index]);
                    dayStats[m2].max = Math.max(dayStats[m2].max, data.max_values[index]);
                }
            }

            $scope.isLoading = false;
            
            $scope.days = [];
            for (key in dayStats) {
                var val = dayStats[key];
                $scope.days.push({ date: key, min: val.min, max: val.max });
            }
        })
        .error(function(data, status, headers, config) {
            $scope.isLoading = false;
            $scope.status = data;
        });
}
