/**
 * User: jbaumbach
 * Date: 10/8/13
 * Time: 11:42 PM
 */

var eventViewController = app.controller('eventViewController', function($scope,
  $dialog, $location, EventUser, UserActions, User) {

  // todo: use the $routeParams angular component rather than regex
  var eventId = document.URL.match(/events\/([a-zA-Z0-9-]*)/i)[1];

  $scope.loadingEventUsers = true;
  $scope.loadingRegisteredUsers = true;

  function setMsg(type, msg) {
    $scope.notifyClass = type;
    $scope.notifyMsg = msg;

    //Optional - smooth scroll to the top
    $("html, body").animate({ scrollTop: $("#manual-entry").offset().top }, "slow");
  };

  function clearMsg() {
    $scope.notifyMsg = false;
  }

  function createNewUserForManualEntry() {
    var pw = generateGuid().substr(0,15);
    $scope.newUser = new User({
      action: 'createAndCheckinByEventOwner',
      eventId: eventId,
      password: pw,
      password2: pw
    });
  }
  
  $scope.addUser = function() {
    $scope.savingNewUser = true;
    // The username is the email address
    $scope.newUser.userName = $scope.newUser.email;
    $scope.newUser.$save(function success() {
      clearMsg();
      $scope.savingNewUser = false;

      // Reset the fields, add the user to the checked in users section
      $scope.checkedInUsers.push($scope.newUser);
      createNewUserForManualEntry();

    }, function fail(err) {
      $scope.savingNewUser = false;
      console.log(err);
      
      var msg = 'Please correct these validation errors: ' + 
        (err.data.msg instanceof Array ? err.data.msg.join(', ') : err.data.msg);

      setMsg('error', msg);
    });
  };
  
  function updateUserStatus() {

    if ($scope.pageVars.user && $scope.pageVars.user.id) {
      //
      // We have a user, need to check if they've already registered or checked in
      //
      if (!$scope.loadingEventUsers && !$scope.loadingRegisteredUsers) {

        var isRegistered = _.find($scope.registeredUsers, function(user) {
          return user.id == $scope.pageVars.user.id;
        });

        var isCheckedIn = _.find($scope.checkedInUsers, function(user) {
          return user.id == $scope.pageVars.user.id;
        });

        $scope.userCanRegister = !isRegistered && !isCheckedIn;
        $scope.userIsRegistered = !$scope.userCanRegister;
        
        if ($scope.userIsRegistered) {
          $scope.userStatus = isRegistered ? 'registered' : 'checked-in';
        }
      }
    } else {
      $scope.userCanRegister = true;
    }
  }
  
  //
  // Load user data into our model
  //
  $scope.init = function(pageVars) {
    $scope.pageVars = pageVars;

    updateUserStatus();
    
    if (getQueryStringParameterByName('register')) {
      $scope.register();
    }
  }

  $scope.checkedInUsers = EventUser.query({ 
    eventId: eventId, 
    type: 'checkedin' 
  }, function() {
    // success
    $scope.loadingEventUsers = false;
    updateUserStatus();

  }, function(err) {
    // fail!
    $scope.loadingEventUsers = false;
    updateUserStatus();
    
  })

  $scope.registeredUsers = EventUser.query({
    eventId: eventId,
    type: 'registered'
  }, function() {
    // success
    $scope.loadingRegisteredUsers = false;
    updateUserStatus();

  }, function(err) {
    // fail!
    $scope.loadingRegisteredUsers = false;
    updateUserStatus();

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
      updateUserStatus();
      
    }, function(err) {
      // failure!
      registeredUser.isCheckingIn = false;

      var btns = [{result:'ok', label: 'OK', cssClass: 'btn-primary'}];
      $dialog.messageBox('Oops, an error', err.data.msg, btns)
        .open();
    });
  }
  
  //
  // Happens on button click or page-load if ?register=1
  // 
  $scope.register = function() {
    
    if ($scope.pageVars.user && $scope.pageVars.user.id) {
      
      // Logged in - register the user

      var options = {
        action: 'registerUser',
        userId: $scope.pageVars.user.id,
        eventId: eventId
      }

      $scope.isRegistering = true;
      
      UserActions.save(options, function() {
        // success
        $scope.isRegistering = false;
        $scope.registeredUsers.push($scope.pageVars.user);
        updateUserStatus();

      }, function(err) {
        // failure
        $scope.isRegistering = false;
      })
      
    } else {
      
      // Not logged in - redirect to login page
      
      var loginDest = encodeURIComponent('/events/' + eventId + '?register=1');
      var url = $scope.pageVars.secureProtocol + '://' + $scope.pageVars.serverPath + 
        '/login?loginDest=' + loginDest;
      
      window.location = url;
    }
  }

  // Main
  createNewUserForManualEntry();
  
});
