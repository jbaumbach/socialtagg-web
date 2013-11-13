/**
 * User: jbaumbach
 * Date: 10/8/13
 * Time: 11:42 PM
 */

var eventViewController = app.controller('eventViewController', function($scope, EventUser, UserActions, $dialog) {

  $scope.loadingEventUsers = true;
  $scope.loadingRegisteredUsers = true;

  // todo: use the $routeParams angular component rather than regex
  var eventId = document.URL.match(/events\/(.*)/i)[1];

  //
  // Load user data into our model
  //
  $scope.init = function(pageVars) {
    $scope.user = pageVars.user;
    console.log('got user: ' + $scope.user);
  }

  $scope.checkedInUsers = EventUser.query({ 
    eventId: eventId, 
    type: 'checkedin' 
  }, function() {
    // success
    $scope.loadingEventUsers = false;

  }, function(err) {
    // fail!
    $scope.loadingEventUsers = false;
    
  })

  $scope.registeredUsers = EventUser.query({
    eventId: eventId,
    type: 'registered'
  }, function() {
    // success
    $scope.loadingRegisteredUsers = false;

  }, function(err) {
    // fail!
    $scope.loadingRegisteredUsers = false;

  })

  $scope.checkinUser = function(registeredUser) {
    var options = {
      action: 'checkinUser',
      userId: registeredUser.id,
      eventId: eventId
    }

    registeredUser.isCheckingIn = true;
    
    UserActions.save(options, function() {
      // success
      $scope.registeredUsers = _.without($scope.registeredUsers, registeredUser);
      $scope.checkedInUsers.push(registeredUser);
      
    }, function(err) {
      // failure!
      registeredUser.isCheckingIn = false;

      var btns = [{result:'ok', label: 'OK', cssClass: 'btn-primary'}];
      $dialog.messageBox('Oops, an error', err.data.msg, btns)
        .open();
    });
  }
  
  $scope.register = function() {
    
  }

});
