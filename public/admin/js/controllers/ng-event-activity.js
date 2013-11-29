
app.controller("EventActivity", function ($scope, $route, EventActivity) {
  
  $scope.summary = EventActivity.get(
    function success() {
      // loading = false
    }, function fail() {
      console.log('crud, error: ' + arguments[0].data.msg);
    }
  )
});