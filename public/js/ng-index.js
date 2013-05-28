/*
   Angular codebehind file.  Note that the file extension is ".js", which
   is just like your site's node.js files.  For larger sites, this could cause
   naming collisions.
   
   By convention, it's a good idea to prefix the filenames of Angular files 
   with "ng-" to distinguish them from your node.js codebehinds.
*/


var app = angular.module('indexApp', ['ui.bootstrap']);

// Allow POST to different port on the server
app.config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);

var loginController = app.controller('loginController', function($scope, $http, $location) {
  // Login controller
  $scope.user = {};

  // Init function allows the server to initialize Angular variables
  // in case the page gets reloaded or otherwise lost.
  $scope.init = function(pageVars) {
    $scope.isLoggedIn = pageVars.isLoggedIn;
    console.log('found value isLoggedIn: ' + $scope.isLoggedIn);
    $scope.user = pageVars.user;
  }

  $scope.clearError = function() {
    $scope.loginError = false;
  }

  $scope.login = function() {

    // todo: urlencode these values
    var postData = 'email=' + $scope.email + '&password=' + $scope.password;

    $scope.loading = true;

    console.log('login: ' + postData);
    console.log('url: ' + $location.path());
    
    // Note: always use $https/SSL for passing values, $http used here for
    // simplicity.
    $http({
      url: 'https://localhost:3000/login',
      method: 'POST',
      data: postData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    }).success(function(data, status, headers, config) {
      console.log('successful login' + data);
      $scope.isLoggedIn = true;
      $scope.user.name = data.name;
      $scope.loading = false;

      // Close the dialog
      $.fancybox.close();

    }).error(function(data, status, headers, config) {
      console.log('oops, failure! ' + data);
      $scope.loginError = true;
      $scope.loading = false;

      });
  }

  $scope.logout = function() {
    console.log('logging out');

    $http({
      url: '/logout',
      method: 'GET'
    }).success(function(data, status, headers, config) {
        $scope.isLoggedIn = false;
        $scope.user = {};
        console.log('logged out ok');
      }).error(function(data, status, headers, config) {
        console.log('crud, server doesn\'t wanna log out');

      });
  }
})