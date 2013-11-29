angular.module("EventActivityResource", ["ngResource"]).
  factory("EventActivity", function($resource) {
    return $resource(
      "/apiv1/socialtagg/events/activity"
    );
  });
app.requires.push("EventActivityResource");
