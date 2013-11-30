
angular.module("EventActivityResource", ["ngResource"]).
  factory("EventActivity", function($resource) {
    return $resource(
      "/apiv1/socialtagg/events/activity"
    );
  });
app.requires.push("EventActivityResource");

angular.module("UserActivityResource", ["ngResource"]).
  factory("UserActivity", function($resource) {
    return $resource(
      "/apiv1/socialtagg/users/activity"
    );
  });
app.requires.push("UserActivityResource");

