
console.log('ng-index: loading');

var app = angular.module("app", []);

app.config(function ($routeProvider, $locationProvider) {

  // Allows normal urls w/o "#" in modern browsers (safe in older too)
  // However, the node server won't know if this is an Angular route or a Node route.
  // This causes 404s when someone reloads the page or starts with a url.
  // Leave in for now?
  // $locationProvider.html5Mode(true).hashPrefix('!');
  
  // All the routes used in our app
  $routeProvider
    .when('/',
    {
      templateUrl:"templates/views/home.html",
      controller:"HomeCtrl"
    })
    .when('/event-activity',
    {
      templateUrl:"templates/views/event-activity.html",
      controller:"EventActivity"
    })
    .otherwise({
      templateUrl:"templates/views/home.html",
      controller:"HomeCtrl"
    });
});

// The directive is specified as "st-login-status" in the code.  Angular converts the name.
app.directive('stLoginStatus', function() {
  return {
    restrict: 'E',  // The directive can be in html as an element (just 'A' by default)
    templateUrl: "admin/templates/directives/login-status.html"
  }
})


// Helper functions

function st_getMaxValueOfChartData(data) {
  var result = 0;

  if (data && data.datasets && data.datasets.length > 0) {
    angular.forEach(data.datasets[0].data, function(item) {
      if (item > result) {
        result = item;
      }
    })
  }

  return result;
}
