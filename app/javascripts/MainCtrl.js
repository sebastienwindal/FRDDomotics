function MainCtrl($scope, $http) {
 
    $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode('seb:password'); 
    $http.get("https://localhost/api/temperature/1", {})
        .success(function(data, status, headers, config) {
            $scope.data = data;
        })
        .error(function(data, status, headers, config) {
            $scope.status = status;
        });


}