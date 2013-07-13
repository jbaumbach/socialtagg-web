/**
 * User: jbaumbach
 * Date: 7/7/13
 * Time: 6:53 PM
 */

angular.module("eventService", ["ngResource"]).
  factory("Event", function ($resource) {
    return $resource(
      "/apiv1/loggedinuser/ownedevents/:uuid",
      { uuid: "@uuid" },
      { "update": { method: "PUT" } }
    );
  });

// Add eventService dependency to the app 
app.requires.push('eventService');

var eventController = app.controller('eventController', function($scope, Event) {
  
  $scope.isLoading = true;
  $scope.hasError = false;
  
  var createEvent = function (newEvent) {
    newEvent.$save(function() {
      
      console.log('save success');
      $scope.events.push(newEvent);
      setEdit(false, null);
      
    }, function() {
      console.log('save error');
      setErr(true, arguments);
    });
  };

  var updateEvent = function(event) {
    event.$update(function() {
      console.log('update success');
      setEdit(false, null);

    }, function() {
      console.log('update error');
      setErr(true, arguments);
    });
  };

  var setEdit = function(isEditVisible, editableEvent) {
    $scope.isEditVisible = isEditVisible;
    $scope.editableEvent = editableEvent;
    setErr(false, null);
  }
  
  var setErr = function(hasError, arguments) {
    $scope.hasError = hasError;
    
    if (hasError) {
      if (arguments.length > 0 && arguments[0].data && arguments[0].data.errors) {
        $scope.errorMsg = arguments[0].data.errors.join(', ');
      } else {
        $scope.errorMsg = 'Unknown server error, please try again in a bit.';
      }
    }
  }
  
  $scope.showEdit = function () {
    setEdit(true, new Event());
  };

  $scope.cancelEdit = function() {
    setEdit(false, null);
  }
  
  $scope.saveEvent = function (event) {
    if (event.uuid) {
      updateEvent(event);
    }
    else {
      createEvent(event);
    }
  };

  $scope.editEvent = function (event) {
    $scope.isEditVisible = true;
    $scope.editableEvent = event;
  };

  $scope.deleteEvent = function (event) {
    event.$delete(function() {
      console.log('delete success');
      $scope.events = _.without($scope.events, event);
      setEdit(false, null);

    }, function() {
      console.log('delete error');
    });
  };

  $scope.isEditVisible = false;
  $scope.events = Event.query(function() {
    // query complete
    $scope.isLoading = false;
    $scope.hasEvents = $scope.events && $scope.events.length > 0;
  });

});