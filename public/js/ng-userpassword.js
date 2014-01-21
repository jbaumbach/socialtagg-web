
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
      method: 'POST',
      data: postData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
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
    console.log('init!');
    console.log(pageVars);
    
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
    }
  }

  $scope.save = function() {
    console.log('saving');
    $scope.isWorking = true;

//    function handleResponseErrors(arguments) {
//      // Error
//      var msg = 'Unknown error, please try again later!';
//      if (arguments.length > 0 && arguments[0].data && arguments[0].data.errors) {
//        msg = 'Please correct these validation errors: ' + arguments[0].data.errors.join(', ');
//      }
//
//      setMsg('error', msg);
//
//    }

    // Save
//    $scope.user.update(function success() {
//
//      $scope.isWorking = false;
//
//      // Success
//      setMsg('success', 'Your information was updated successfully');
//
//    }, function error() {
//      $scope.isWorking = false;
//
//      handleResponseErrors(arguments);
//    });
    
    //   function trySubmitUserInfo(postData, postUrl, successFunction, failFunction) {

    var postUrl = $scope.secureProtocol + '://' + $scope.serverPath + '/apiv1/setnewpassword';

    console.log('posturl: ' + postUrl);
    
    trySubmitUserInfo($scope.user, postUrl, function success() {
      //
      // Success
      //
      console.log('success');
    }, function error(data) {
      console.log('error!');
      console.log(data);
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

