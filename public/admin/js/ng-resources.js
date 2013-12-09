
angular.module("EventActivityResource", ["ngResource"]).
  factory("EventActivity", function($resource) {
    return $resource(
      "/apiv1/socialtagg/events/activity"
    );
  });
app.requires.push("EventActivityResource");

angular.module("EventActivityDetailResource", ["ngResource"]).
  factory("EventActivityDetail", function($resource) {
    return $resource(
      "/apiv1/socialtagg/events/activity/:year/:type/:id"
    );
  });
app.requires.push("EventActivityDetailResource");

angular.module("UserActivityResource", ["ngResource"]).
  factory("UserActivity", function($resource) {
    return $resource(
      "/apiv1/socialtagg/users/activity"
    );
  });
app.requires.push("UserActivityResource");

