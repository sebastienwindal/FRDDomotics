function TemperatureCtrl($scope, $routeParams, $http) {

    $scope.timeInterval = null;

    $scope.$watch("timeInterval", function(newValue, oldValue) {
        if (newValue && newValue != oldValue) {
            alert(newValue.timeSpan);
            $scope.fetchData(newValue);
        }
    });

    $scope.fetchData = function(timeOption) {

        $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode('seb:password'); 
        $http.get("/api/temperature/" + $routeParams.sensorID + "?timeSpan=" + timeOption.timeSpan, {})
            .success(function(data, status, headers, config) {
                $scope.data = data;
                $scope.updateChart();
            })
            .error(function(data, status, headers, config) {
                $scope.status = data;
            });
    };

    $scope.updateChart = function() {
        nv.addGraph(function() {
            var chart = nv.models.stackedAreaChart();
            chart.xAxis
                .tickFormat(function(d) { return d3.time.format('%X')(new Date(d)) });

            chart.yAxis
                .axisLabel('Voltage (v)')
                .tickFormat(d3.format('.02f'));

            d3  .select('#chart svg')
                .datum($scope.sinAndCos())
                .transition().duration(500)
                .call(chart);

            nv.utils.windowResize(function() { d3.select('#chart svg').call(chart) });

            return chart;
        });
    };

    $scope.sinAndCos = function() {
        var sin = [];
        var now = new Date($scope.data.most_recent_measurement_date).getTime();
        for (var i in $scope.data.temperatures) {
            sin.push({x: now-$scope.data.date_offset[i]*1000, y: $scope.data.temperatures[i]});
        }

        return [
            {
                values: sin,
                key: 'Sine Wave',
                color: '#ff7f0e'
            }
        ];
    };
}
