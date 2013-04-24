app.directive('timeSpanPicker', function() {
    return {

        name: 'TimeSpanPicker',
        scope: {
            time: "="
        },
        restrict: 'E',
        template: '<ul><li ng-repeat="timeOption in timeOptions" ng-click="selectTimeOption(timeOption)">{{timeOption.display}}</li></ul>',
        link: function($scope, iElm, iAttrs, controller) {
            $scope.timeOptions = [
                                    {
                                        display: "last hour",
                                        timeSpan: 60 * 60
                                    },
                                    { 
                                        display: "last 4 hours",
                                        timeSpan: 4 * 60 * 60
                                    },
                                    {
                                        display: "last 12 hours",
                                        timeSpan: 12 * 60 * 60
                                    },
                                    {
                                        display: "last 24 hours",
                                        timeSpan: 24 * 60 * 60
                                    },
                                    {
                                        display: "today"                                        
                                    }
                                    ];

            $scope.selectTimeOption = function(option) {
                $scope.time = option;
            };

        }
    };
});