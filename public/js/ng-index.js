/*
   Angular codebehind file.  Note that the file extension is ".js", which
   is just like your site's node.js files.  For larger sites, this could cause
   naming collisions.
   
   By convention, it's a good idea to prefix the filenames of Angular files 
   with "ng-" to distinguish them from your node.js codebehinds.
*/

var app = angular.
  module('indexApp', ['ui.bootstrap']).
  config(function($provide) {
    // "Decorate" the default Angular exception handler with Sentry logging
    $provide.decorator("$exceptionHandler", function($delegate) {
      return function(exception, cause) {
        $delegate(exception, cause);
        // alert(exception.message);
        if (Raven) {
          Raven.captureException(exception);
        } else {
          console.log('(warning) Raven not found!');
        }
      };
    });
  })
  ;

//
// Angular resources from ng-resources.js
//
app.requires.push('eventUserService');
app.requires.push('userService');
app.requires.push('userActionsService');


//
// Todo: move this out to ng-login.js
//
var loginController = app.controller('loginController', function($scope, $http, $location, $log) {
  // Login controller

  $scope.loginModes = {
    login: 0,
    create: 1,
    regSent: 2
  }

  $scope.user = {};
  
  // Don't release with this line - just for dev only!!!
  //console.log('(warning) debug code!!!  - "$scope.loginModes.create"')
  //$scope.mode = $scope.loginModes.create;


  function setMsg(type, msg) {
    $scope.notifyClass = type;
    $scope.notifyMsg = msg;
  };

  function clearMsg() {
    $scope.notifyMsg = false;
  }

  // Angular.js hack for Lastpass and other browser-based autocompleters.
  function fillAutocompleterFieldIfNecessary(domElement, targetVar) {
    if (!targetVar && $(domElement).val()) {
      targetVar = $(domElement).val();
      console.log('(info) fixedup val for: ' + domElement);
    }
  }
  
  $scope.clearMsg = clearMsg;
  
  // Init function allows the server to initialize Angular variables
  // in case the page gets reloaded or otherwise lost.
  $scope.init = function(pageVars) {

    $scope.isLoggedIn = pageVars.isLoggedIn;
    $scope.user = pageVars.user;
    $scope.serverPath = pageVars.serverPath;
    $scope.secureProtocol = pageVars.secureProtocol;
    $scope.loginDest = pageVars.loginDest;
    $scope.newAcctUrl = pageVars.newAcctUrl;
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
  // Create a new user
  //
  $scope.create = function() {

    fillAutocompleterFieldIfNecessary('#username', $scope.email);
    
    if (!$scope.readterms) {
      
      setMsg('error', 'Please agree to the terms and conditions.');
      
    } else {

      var postData = 'email=' + $scope.email;
      var postUrl = $scope.secureProtocol + '://' + $scope.serverPath + '/registration/createnewaccount';
      
      trySubmitUserInfo(postData, postUrl, function() {
        // Success
        $scope.mode = $scope.loginModes.regSent;
        
      }, function(data) {
        // Fail
        setMsg('error', data.msg);
      });
      
    }
  };
  
  $scope.login = function() {

    fillAutocompleterFieldIfNecessary('#username', $scope.email);
    fillAutocompleterFieldIfNecessary('#password', $scope.password);

    var postData = 'email=' + $scope.email + '&password=' + $scope.password;
    var successUrl = $scope.secureProtocol + '://' + $scope.serverPath + ($scope.loginDest || '');
    var postUrl = $scope.secureProtocol + '://' + $scope.serverPath + '/login';

    trySubmitUserInfo(postData, postUrl, function() {
      // Success
      window.location = successUrl;
    });
  }

  $scope.loginMode = function(newMode) {
    $scope.mode = newMode;
  }
  
  $scope.forgotPw = function() {
    if (!$scope.email || $scope.email.length < 5) {
      setMsg('error', 'Please enter your email address');
    } else {

      var postData = 'useremail=' + $scope.email;
      var postUrl = $scope.secureProtocol + '://' + $scope.serverPath + '/apiv1/resetpassword';

      trySubmitUserInfo(postData, postUrl, function success() {
        setMsg('success', 'An email has been sent to the email address containing instructions on ' +
          'how to reset your password.  Please allow a few minutes for the email to arrive in your ' +
          'inbox!  And be sure to check your spam or marketing folder(s) before trying again.')
      }, function error(data) {
        
        console.log('Error!');
        console.log(data);
        setMsg('error', 'Oops, there\'s been a problem.')
      });
    }
  }

  $scope.socialTaggProviderLogin = function(provider) {
    var navigateTo = '/loginpp/' + provider;
    window.location = navigateTo;
  }
})

// Directive to prevent the default html action for following # anchors
loginController.directive('noClick', function() {
  return function(scope, element, attrs) {
    $(element).click(function(event) {
      event.preventDefault();
    });
  }
});
