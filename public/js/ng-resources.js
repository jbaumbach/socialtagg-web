
angular.module("eventUserService", ["ngResource"]).
  factory("EventUser", function ($resource) {
    return $resource(
      "/apiv1/events/:eventId/users",
      { eventId: "@eventId" }
    );
  });

angular.module("userService", ["ngResource"]).
  factory("User", function($resource) {
    return $resource(
      "/apiv1/users/:id",
      { id: "@id" },
      { update: { method: "PUT" } }
    );
  });

angular.module("userActionsService", ["ngResource"]).
  factory("UserActions", function($resource) {
    return $resource(
      "/apiv1/users"
    );
  });

