/**
 * User: jbaumbach
 * Date: 8/27/13
 * Time: 10:47 AM
 */


angular.module("userService", ["ngResource"]).
  factory("User", function($resource) {
    return $resource(
      "/apiv1/users/:id",
      { id: "@id" },
      { update: { method: "PUT" } }
    );
  });

// Add services dependencies to main app
app.requires.push('userService');

var userController = app.controller('userController', function($scope, $dialog, User) {
  $scope.user = {};
  
  // testing
  /*
  $scope.notifyClass = 'success';
  $scope.notifyMsg = 'Just checking in.  How\'s it going?';
  $scope.isWorking = true;
  */
  
  function setMsg(type, msg) {
    $scope.notifyClass = type;
    $scope.notifyMsg = msg;
  };
  
  function clearMsg() {
    $scope.notifyMsg = false;
  }
  //
  // Load user data into our model
  //
  $scope.init = function(pageVars) {
    $scope.user = new User(pageVars.user);
  }
  
  $scope.updateUser = function() {
    $scope.isWorking = true;
    
    $scope.user.$update(function() {
      $scope.isWorking = false;
      
      // Success
      setMsg('success', 'Your information was updated successfully');
      
      //Optional - smooth scroll to the top
      $("html, body").animate({ scrollTop: 0 }, "slow");
      
    }, function() {
      $scope.isWorking = false;
      
      // Error
      var msg = 'Unknown error, please try again later!';
      if (arguments.length > 0 && arguments[0].data && arguments[0].data.errors) {
        msg = 'Please correct these validation errors: ' + arguments[0].data.errors.join(', ');
      }
      
      setMsg('error', msg);
    });
  }
});


// Directive to prevent the default html action for following # anchors
userController.directive('noClick', function() {
  return function(scope, element, attrs) {
    $(element).click(function(event) {
      event.preventDefault();
    });
  }
});
