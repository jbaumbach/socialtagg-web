
/*
 * User - controllers
 */

var userManager = require('./../data/userManager')
  , util = require('util')
  , globalfunctions = require('./../common/globalfunctions')
  , User = require('../models/User')
  , application = require('../common/application')
  , userapi = require('../routesapi/userapi')
  , async = require('async')
  ;

exports.loginForm = function(req, res) {

  var passportError = globalfunctions.getAndDeleteSessionValue(req, 'passportError');
  console.log('have passportError? ' + passportError);

  var pageVars = { 
    title: 'User Login', 
    usesAngular: true,
    public: { 
      newAcctUrl: application.links().editprofile,
      displayErrorMessage: passportError 
    } // pass this on to Angular
  };
  
  application.buildApplicationPagevars(req, pageVars, function(pageVars) {
    res.render('login', pageVars);
  });

};

//
// The site has posted Facebook login info
//
exports.loginfb = function(req, res) {
  console.log('(info) login attempt for Facebook');
  
  var fbUser = req.body;
  
  // console.log('user: ' + util.inspect(fbUser));
 
  var currentUserId = application.getCurrentSessionUserId(req);
  
  if (!currentUserId) {
    
    //
    // Let's log the user in via Facebook
    //
    userManager.validateFacebookLogin(fbUser.authResponse.accessToken, function(err, user) {
      
      if (!err) {

        // console.log('got user: ' + util.inspect(user));
        //
        // User validated successfully.  
        //
        globalfunctions.loginUser(req, user.id);

        res.send(200, user);

      } else {
        
        res.send(403, { msg: 'Error logging in the user, our best msg is: ' + err});
        
      }
    });
    
  } else {

    //
    // User is already logged in - not sure what to do here...  just say "ok, bro"?
    //
    res.send(200);
  }
  
}

/*
  Attempt to create a new user account from the posted info
*/
exports.createRegistration = function(req, res) {
  
  var email = req.body.email;
  // var pw = req.body.password;
  
  userManager.getUserByEmail(email, function(user) {
    if (user) {

      res.send(403, { msg: 'Sorry, that email address is already in use' } );
      
    } else {
      
      var v = application.ErrorCollectingValidator();
      
      v.check(email, 'Please enter a valid email address').isEmail();
      
      // Not checking passwords in this step - they'll be on the user profile page
      // v.check(pw, 'Please enter a password between 6 and 15 chars').len(6, 15);
      
      if (v.getErrors().length > 0) {
        
        res.send(403, { msg: v.getErrors()[0] });
        
      } else {

        var valCode = globalfunctions.md5Encode('valCode' + email + new Date());
        var regInfo = { email: email, validationCode: valCode };
        
        userManager.upsertUserRegistration(regInfo, function(err, userReg) {
        
            if (err) {
              
              res.send(500, { msg: 'Oops!  An error has occurred.  Please try again later.'});
              
            } else {
              
              var verificationUrl = application.registrationValidationUrl(email, valCode);
              
              userapi.sendVerificationEmailWebsite(email, verificationUrl, function(err, info) {

                if (err) {
                  console.log('(error) user.createRegistration: check the logs');  
                }
                
                res.send(201, { msg: 'Success!' });
              });
            }
        });
      }
    } 
  });
}

exports.registrationVerify = function(req, res) {
  
  var email = req.query.email;
  var valCode = req.query.code;
  
  // console.log('email: ' + email + ', val: ' + valCode);
  
  userManager.getRegistrationInfoByEmail(email, function(err, userReg) {
    if (err) {
      // todo: send a better error, like actual HTML, in all these messages below
      res.send(500, { msg: 'Sorry, there\'s been a system error.  Please try again later' });
      
    } else if (!userReg) {
      
      res.send(404, { msg: 'Sorry, that email address cannot be found.'} );
      
    } else {
      
      // OK, found the email
      if (userReg.validationCode === valCode) {
        
        // Sweet!  All validated.  Make sure the email doesn't suddenly exist
        // in the system already
        
        userManager.getUserByEmail(email, function(user) {
          
          if (user) {
            
            res.send(400, { msg: 'The email address corresponding to this registration' +
              'is already in the system.  You should be able to log in to SocialTagg normally.'});
            
          } else {
            
            // Ok, legit new registration.  Go to complete-profile page.

            //
            // Set a temporary authentication flag so the user can 'post' to the
            // /users API endpoint
            //
            globalfunctions.loginTempUser(req, email);
            
            var initialPageVars = {
              title: 'Create My Profile',
              usesAngular: true,
              public: {
                user: new User({ userName: email, email: email })
              },
              loginDest: application.links().viewprofile,
              message: { text: 'You\'re almost there!  Please complete your profile information and click ' +
                'save to complete your registration.' }
            };

            application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
              res.render('useredit', pageVars);
            });
          }
        });
        
      } else {
        
        res.send(400, { msg: 'Sorry, the validation code does not match the one ' +
          'in our system.  If you had multiple registration emails sent, make sure ' +
          'you click the link in the LAST one.'})
      }
    }
  })
  
};

//
// The site has posted login info
//
exports.login = function(req, res) {
  console.log('(info) in login func - might have some failureFlash stuff: ' + util.inspect(req));
  
  var email = req.body.email;

  // only hash password if we're storing it ourselves: globalfunctions.hashPassword(req.body.password);
  var password = req.body.password; 

  userManager.validateCredentials(email, password, function(user) {
    
    if (user) {
      console.log('logged in ok');
      //
      // User validated successfully.  
      //
      globalfunctions.loginUser(req, user.id);

      // Conditionally return a response based on who our client is
      res.format({
        // AJAX: let's return 'OK' and some data
        json: function() {
          res.json(200, user); 
        },

        // HTML page: redirect to homepage
        html: function() { res.redirect('/'); }
      });


    } else {
      console.log('failed login');

      //
      // Oops, something went wrong.  
      //

      var delayMs = 250;
      var todoAfterAShortDelay = function() {

        res.format({
          json: function() { res.json(401, { msg: 'Incorrect email or pw' }); },
//          html: function() { throw 'HTML login not yet supported'; }
          // 2014/02/26 JB: how are requests getting here????
          html: function() { res.send(400, 'Sorry, you\'ve accessed an unsupported function.'); }
        });
      }

      setTimeout(todoAfterAShortDelay, delayMs);
      
    }
  })
}

/*
  Log out the currently logged in user
 */
exports.logout = function(req, res) {
  globalfunctions.logoutUser(req);
  res.redirect(globalVariables.applicationHomepage);
}

exports.new = function(req, res) {
  var pageVars = {
    title: 'New User',
    user: new User()
  };
  res.render('userAddEdit', pageVars);
}

//
// Display a user's profile.
//
exports.detail = function(req, res) {
  var sessionInfo = globalfunctions.getSessionInfo(req);
  var requestedUserId = req.params.id;
  
  //
  // Special: redirect for Karim's id, which got deleted
  //
  if (requestedUserId.toLowerCase() === '5329e985-5a08-11e2-924d-02e81ac5a17b') {
    var newPath = '/users/1da5e0ea-c8f1-11e2-8424-ade3d689326d';
    res.writeHead(301, {'Location': newPath});
    res.end();
    return;
  }
  
  var requestedUserIsSessionUser = sessionInfo.userId === requestedUserId;
  
  application.getCurrentSessionUser(req, function(currentSessionUser) {

    userManager.getUser(requestedUserId, function (user) {
      if (user) {
        //
        // View user's info
        //
        var pageVars = {
          title: util.format('%s\'s Profile', user.name),
          
          displayUser: user,
          showQrCode: requestedUserIsSessionUser
        }

        application.buildApplicationPagevars(req, pageVars, function(pageVars) {
          res.render('userView', pageVars);
        });
        
      } else {
        res.send(404, 'Sorry, that user is not found.');
      }
    });
  });
  
}

/*
  (Deprecated - we use the API version now w/Angular) 
  Take the user's returned info and update the database.
 */
exports.upsert = function(req, res) {
  
  //
  // Todo: sanitize user input here via https://github.com/chriso/node-validator
  //

  //
  // Create a user object from the submitted form values
  //
  var user = new User({
    name: req.body.name,
    address: req.body.addr,
    email: req.body.email,
    password: globalfunctions.hashPassword(req.body.pw1)
  });

  //
  // If the user is logged in, this is an update.  Add the current 
  // user id to the user object we'll add/insert into the db.
  //
  var sessionInfo = globalfunctions.getSessionInfo(req);
  
  if (sessionInfo.userId) {
    user.id = sessionInfo.id;
  }
  
  userManager.upsertUser(user, function(upsertedUser) {
    //
    // If it worked, we have an upserted user
    //
    if (upsertedUser) {
      
      sessionInfo.userId = upsertedUser.id;
      globalfunctions.setSessionInfo(req, sessionInfo);

      // message: util.format('User successfully %s', loggedIn ? 'updated' : 'created') 

      res.redirect('/');
      
    } else {
      res.render('userAddEdit', 
        {
          title: util.format('%s User', loggedIn ? 'Update' : 'Add'),
          error: util.format('Unable to %s user!', loggedIn ? 'update' : 'create')
        });
    }
    
  }); 
}

//
// Show the current logged in user's contaggs page
//
exports.myContaggs = function(req, res) {

  var exportAction = req.query.action == 'export';
  
  console.log('exportAction: ' + exportAction);
  
  
  function done() {
    application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
      res.render('mycontaggs', pageVars);
    });
  }

  var initialPageVars = { title: 'My Contaggs', loginDest: '/mycontaggs' };
  var userId = application.getCurrentSessionUserId(req);

  if (!userId) {
    console.log('aint got a user id');
    
    done();
  } else {
    
    if (exportAction) {

      //
      // Let's use the API call to get the results
      //
      req.params.id = userId;

      userapi.contaggs(req, res);
      
    } else {

      userManager.getUserContaggs(userId, function(userContaggs) {
        console.log('got contaggs: ' + userContaggs);

        if (userContaggs && userContaggs.length > 0) {

          userManager.populateUserContaggs(userContaggs, function(users) {

            console.log('got populated users: ' + users);

            if (users) {
              initialPageVars.contaggs = users;
              done();
            } else {
              done();
            }
          });
        } else {
          done();
        }
      });
    }
  }
}

//
// Show the current logged in user's events page
//
exports.myAttendedEvents = function(req, res) {
  
  function done() {
    application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
      res.render('myattendedevents', pageVars);
    });
  }

  var initialPageVars = { title: 'My Attended Events' };
  var userId = application.getCurrentSessionUserId(req);

  if (!userId) {
    console.log('(warning) aint got a user id');
    
    done();
  } else {
    
    // remove this when we go live
    if (req.query.specialuuid) {
      userId = req.query.specialuuid;
    }
    
    userManager.getUserEventsAttended(userId, function(err, eventUsers) {
    // userManager.getUserEventsAttended('5b07c30a-082e-11e3-b923-dbfd8bf6ac23', function(err, eventUsers) {

      if (eventUsers && eventUsers.length > 0) {

        userManager.populateEvents(eventUsers, function(err) {

          initialPageVars.eventUsers = eventUsers;
          done();
        });
      } else {
        done();
      }
    });
  }
}

//
// Show the current logged in user's events page
//
exports.myOwnedEvents = function(req, res) {
  
  function done() {
    application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
      res.render('myownedevents', pageVars);
    });
  }

  var initialPageVars = { 
    title: 'My Owned Events', 
    loginDest: application.links.myownedevents,  //'/myownedevents',
    usesAngular: true
  };
  
  var userId = application.getCurrentSessionUserId(req);

  if (!userId) {
    console.log('(warning) myOwnedEvents: aint got a user id');
    
    done();
  } else {
    
    userManager.getUserEventsOwned(userId, function(err, userEvents) {

      if (userEvents && userEvents.length > 0) {

        initialPageVars.events = userEvents;
        done();
      } else {
        
        done();
      }
    });
  }
}

/*
  Show the logged in user's profile page for editing.
 */
exports.myProfile = function(req, res) {

  var initialPageVars = {
    title: 'Edit My Profile',
    usesAngular: true
  };
  
  application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
    res.render('useredit', pageVars);
  });
}

/*
  Show the current session user's public profile page
  Note: this is confusing - there's also the user detail page.  These should be 
  combined.
 */
exports.viewProfile = function(req, res) {

  application.getCurrentSessionUser(req, function(user) {

    var initialPageVars = {
      title: 'View My Profile',
      displayUser: user,
      isLoggedInUser: true,
      showQrCode: true
    };

    application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
      res.render('userView', pageVars);
    });
  });
}

/**
 * Look up the user and verify the validation code is ok
 * 
 * @options: object with properties:
 *  userId: the user id to look up
 *  validationCode: the supplied validation code to verify
 *  resetTheCode: (boolean) if true, remove the validation code from the user
 *  
 * @callback: function with signature:
 *  err: filled in if something went wrong, with properties:
 *    status: a standard HTTP status code
 *    msg: a descriptive message
 *  user: the user requested
 */
var validateResetPasswordCode = exports.validateResetPasswordCode = function(options, callback) {
  
  async.waterfall([
    function getUser(cb) {
      userManager.getUser(options.userId, function(user) {
        if (user) {
          cb(null, user);
        } else {
          cb({ status: 404, msg: 'User not found.' });
        }
      });
    },
    function validateCode(user, cb) {
      if (user.forgotPasswordValidationCode) {
        if (user.forgotPasswordValidationCode === options.validationCode) {
          cb(null, user);
        } else {
          cb({ status: 400, msg: 'We\'re having a little trouble validating this request.  Please reset your password again.'});
        }
      } else {
        cb({ status: 400, msg: 'Huh, it looks like you have not requested a password reset.  Please reset your password again.' });
      }
    },
    function resetTheCode(user, cb) {
      if (options.resetTheCode) {
        throw 'not implemented yet!';
        // todo: create usermanager function to zap arbitrary values from usergrid (may already exist)
      } else {
        cb(null, user);
      }
    }
  ], callback);
};

exports.forgotPassword = function(req, res) {

//  continue here:
//  
//  - make "Forgot Password" link work on login page
//  - update API to send forgot password email and update UG with the validation code
//  - make ng-userpassword Angular controller work
  
  // Actions in this controller method:
  
  
  // step 1: verify the user id and reset password code
  
  // step 2: display the page.  accept the new info via Angular to the API
  
  
  var initialPageVars = {
    title: 'Change Password',
    usesAngular: true
  };

  async.waterfall([
    function validateCode(cb) {
      var options = {
        userId: req.params.id,
        validationCode: req.query.v
      }

      validateResetPasswordCode(options, cb);
    }
  ], function(err, user) {
    //
    // Pass result to Angular, if any
    //
    initialPageVars.public = { 
      err: err,
      user: user
    };

    //
    // The userapi call requires some authentication.
    //
    if (user) {
      globalfunctions.logoutUser(req);
      globalfunctions.loginTempUser(req, user.email);
    }
    
    application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
//      console.log('sanity pageVars: ' + util.inspect(pageVars));
      res.render('userpassword', pageVars);
    });

  })
}