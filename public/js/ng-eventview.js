/**
 * User: jbaumbach
 * Date: 10/8/13
 * Time: 11:42 PM
 */

angular.module("eventUserService", ["ngResource"]).
  factory("EventUser", function ($resource) {
    return $resource(
      "/apiv1/events/:eventId/users",
      { eventId: "@eventId" }
    );
  });

app.requires.push('eventUserService');

var eventViewController = app.controller('eventViewController', function($scope, EventUser) {

  $scope.loadingEventUsers = true;

  // todo: use the $routeParams angular component rather than regex
  var eventId = document.URL.match(/events\/(.*)/i)[1];
  
  $scope.checkedInUsers = EventUser.query({ 
    eventId: eventId, 
    type: 'checkedin', 
    test: window.location.search.slice(1)   // todo: get rid of this 'url parameter grabber' before going live
  }, function() {
    // success
    console.log('success');
    $scope.loadingEventUsers = false;

  }, function(err) {
    // fail!
    console.log('fail!');
    $scope.loadingEventUsers = false;
    
  })
});
