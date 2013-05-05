function TemperatureCtrl($scope, $routeParams, $http) {

    $scope.timeInterval = null;

    $scope.$watch("timeInterval", function(newValue, oldValue) {
        if (newValue && newValue != oldValue) {
            $scope.fetchData(newValue);
        }
    });

    $scope.datasetType = "raw";

    $scope.fetchData = function(timeOption) {
        
        $scope.isLoading = true;

        $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode('seb:password'); 
        $scope.datasetType = timeOption.type;
        var url = "/api/temperature/" + timeOption.type + "/" + $routeParams.sensorID;
        if (timeOption.timeSpan)
            url = url + "?timeSpan=" + timeOption.timeSpan;
        if (timeOption.daySpan)
            url = url + "?timeSpan=" + timeOption.daySpan * 24 * 3600;

        $http.get(url, {})
            .success(function(data, status, headers, config) {
                $scope.data = data;
                $scope.updateChart();

                $scope.isLoading = false;
            })
            .error(function(data, status, headers, config) {
                $scope.status = data;
                $scope.isLoading = false;
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
        
        if ($scope.datasetType == 'raw') {
            for (var i in $scope.data.values) {
            
                sin.push({
                            x: $scope.data.date_offset[i]*1000, 
                            y: $scope.data.values[i]
                        });
            }
        } else {
            for (var i in $scope.data.mean_values) {
                sin.push({
                                x: $scope.data.hour_offset[i], 
                                y: $scope.data.mean_values[i] 
                            });
            }
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
