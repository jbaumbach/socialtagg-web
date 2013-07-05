/*
   Angular codebehind file.  Note that the file extension is ".js", which
   is just like your site's node.js files.  For larger sites, this could cause
   naming collisions.
   
   By convention, it's a good idea to prefix the filenames of Angular files 
   with "ng-" to distinguish them from your node.js codebehinds.
*/


var app = angular.module('indexApp', ['ui.bootstrap']);

var loginController = app.controller('loginController', function($scope, $http, $location) {
  // Login controller
  $scope.user = {};

  // Init function allows the server to initialize Angular variables
  // in case the page gets reloaded or otherwise lost.
  $scope.init = function(pageVars) {

    $scope.isLoggedIn = pageVars.isLoggedIn;
    console.log('found value isLoggedIn: ' + $scope.isLoggedIn);
    $scope.user = pageVars.user;
    $scope.serverPath = pageVars.serverPath;
    $scope.secureProtocol = pageVars.secureProtocol;
    $scope.loginDest = pageVars.loginDest;

    $scope.setLoginMessage();
  }

  $scope.setLoginMessage = function() {

    if ($scope.isLoggedIn) {
      $scope.loginMsg = 'Logout ' + $scope.user.firstName;
    } else {
      $scope.loginMsg = 'Login';
    }

  }
  
  $scope.clearError = function() {
    $scope.loginError = false;
  }

  $scope.login = function() {

    // Angular.js hack for Lastpass and other browser-based autocompleters.
    if (!$scope.email && !$scope.password) {
      console.log('(info) fixing possible browser autocompleter');
      $scope.email = $('#username').val();
      $scope.password = $('#password').val();
    };
    
    var postData = 'email=' + $scope.email + '&password=' + $scope.password;

    var successUrl = $scope.secureProtocol + '://' + $scope.serverPath + ($scope.loginDest || '');
    var postUrl = $scope.secureProtocol + '://' + $scope.serverPath + '/login';
    
    $scope.loading = true;

    $http({
      url: postUrl,
      method: 'POST',
      data: postData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    }).success(function(data, status, headers, config) {
      console.log('successful login' + data);
      $scope.isLoggedIn = true;
      $scope.user = data;
      $scope.loading = false;

      window.location = successUrl;

    }).error(function(data, status, headers, config) {
      console.log('oops, failure! ' + data);
      console.log('status: ' + status);
      console.log('headers: ' + headers);
      console.log('config: ' + config);
        
      $scope.loginError = true;
      $scope.loading = false;

      });
  }

  $scope.logout = function() {

    $http({
      url: '/logout',
      method: 'GET'
    }).success(function(data, status, headers, config) {
        $scope.isLoggedIn = false;
        $scope.user = {};

        $scope.setLoginMessage();

      }).error(function(data, status, headers, config) {

      });
  }
})