
app.controller("EventActivityDetail", function ($scope, $route, $routeParams, EventActivityDetail) {

  $scope.pageDesc = st_toTitleCase($routeParams.type + ' ' + $routeParams.id);
  
  var valsToGet = {
    year: $routeParams.year,
    type: $routeParams.type,
    id: $routeParams.id
  }
  
  $scope.summary = EventActivityDetail.get(valsToGet, function success(data) {
    console.log('success!');
  }, function fail(err) {
    console.log('error! ' + arguments[0].data.msg);
  });
  
});