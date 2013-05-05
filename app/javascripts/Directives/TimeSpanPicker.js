app.directive('timeSpanPicker', function() {
    return {
        name: 'TimeSpanPicker',
        scope: {
            time: "="
        },
        restrict: 'E',
        templateUrl: 'javascripts/Directives/timespanpickertemplate.html',
        link: function($scope, iElm, iAttrs, controller) {
            $scope.timeOptions = [
                                    {
                                        display: "last hour",
                                        timeSpan: 60 * 60,
                                        type: "raw"
                                    },
                                    { 
                                        display: "last 4 hours",
                                        timeSpan: 4 * 60 * 60,
                                        type: "raw"
                                    },
                                    {
                                        display: "last 12 hours",
                                        timeSpan: 12 * 60 * 60,
                                        type: "raw"
                                    },
                                    {
                                        display: "last 24 hours",
                                        timeSpan: 24 * 60 * 60,
                                        type: "raw"
                                    },
                                    {
                                        display: "two days",
                                        type: 'hourly',
                                        daySpan: 2
                                    },
                                    {
                                        display: "weekly",
                                        type: 'hourly',
                                        daySpan: 7
                                    },
                                    {
                                        display: "biweekly",
                                        type: 'hourly',
                                        daySpan: 14
                                    },
                                    {
                                        display: "monthly",
                                        type: 'hourly',
                                        daySpan: 30
                                    },
                                    {
                                        display: "all",
                                        type: 'hourly',
                                        daySpan: 99999999
                                    }
                                    ];

            $scope.selectTimeOption = function(option) {
                $scope.time = option;
            };

            $scope.selectTimeOption($scope.timeOptions[1]);
        }
    };
});
