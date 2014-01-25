
var userPasswordController = app.controller('userPasswordController', function($http, $scope, $dialog, User) {
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

  function trySubmitUserInfo(postData, postUrl, successFunction, failFunction) {
    $scope.loading = true;

    $http({
      url: postUrl,
      method: 'PUT',
      data: postData,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    }).success(function (data, status, headers, config) {
        $scope.loading = false;

        if (successFunction) {
          successFunction();
        }

      }).error(function (data, status, headers, config) {

        $scope.loginError = true;
        $scope.loading = false;

        if (failFunction) {
          failFunction(data);
        }
      });
  }

  //
  // Load user data into our model
  //
  $scope.init = function(pageVars) {

    if (pageVars.err) {
      setMsg('error', pageVars.err.msg);
    } else {
      // pageVars.user
      $scope.user = {
        id: pageVars.user.id,
        firstName: pageVars.user.firstName,
        v: getQueryStringParameterByName('v')
      };

      $scope.serverPath = pageVars.serverPath;
      $scope.secureProtocol = pageVars.secureProtocol;
      $scope.loginDest = pageVars.loginDest;

    }
  }

  $scope.save = function() {

    $scope.isWorking = true;

    var postUrl = $scope.secureProtocol + '://' + $scope.serverPath + '/apiv1/users/' + 
      $scope.user.id + '/newpassword';
    var successUrl = $scope.secureProtocol + '://' + $scope.serverPath + ($scope.loginDest || '');

    trySubmitUserInfo($scope.user, postUrl, function success() {
      $scope.isWorking = false;

      //
      // Success
      //
      window.location = successUrl;

    }, function error(data) {
      $scope.isWorking = false;

      setMsg('error', data.msg);
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
