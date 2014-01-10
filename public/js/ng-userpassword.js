
var userPasswordController = app.controller('userPasswordController', function($scope, $dialog, User) {
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

    //Optional - smooth scroll to the top
    $("html, body").animate({ scrollTop: $("#page-title").offset().top }, "slow");
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

    function handleResponseErrors(arguments) {
      // Error
      var msg = 'Unknown error, please try again later!';
      if (arguments.length > 0 && arguments[0].data && arguments[0].data.errors) {
        msg = 'Please correct these validation errors: ' + arguments[0].data.errors.join(', ');
      }

      setMsg('error', msg);

    }

    // Update
    $scope.user.$update(function success() {

      $scope.isWorking = false;

      // Success
      setMsg('success', 'Your information was updated successfully');

    }, function error() {
      $scope.isWorking = false;

      handleResponseErrors(arguments);
    });
    
  }
});

// todo: find a way to move these to a "ng-common" file or something 

// Directive to prevent the default html action for following # anchors
userPasswordController.directive('noClick', function() {
  return function(scope, element, attrs) {
    $(element).click(function(event) {
      event.preventDefault();
    });
  }
});

// drag and drop option: 
//  http://buildinternet.com/2013/08/drag-and-drop-file-upload-with-angularjs/
//  http://jsfiddle.net/lsiv568/fsfPe/10/

