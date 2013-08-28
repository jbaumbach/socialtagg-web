
/*
 * User - controllers
 */

var userManager = require('./../data/userManager')
  , util = require('util')
  , globalfunctions = require('./../common/globalfunctions')
  , User = require('../models/User')
  , ApiUser = require('../models/ApiUser')
  , application = require('../common/application')
  , userapi = require('../routesapi/userapi')
  ;

exports.loginForm = function(req, res) {
  
  var pageVars = { 
    title: 'User Login', 
    usesAngular: true,
    showsocial: req.query.showsocial
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

//
// The site has posted login info
//
exports.login = function(req, res) {
  console.log('(info) in login func');
  
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
          html: function() { throw 'HTML login not yet supported'; }
        });
      }

      setTimeout(todoAfterAShortDelay, delayMs);
      
    }
  })
}

exports.logout = function(req, res) {
  globalfunctions.logoutUser(req);
  res.redirect(application.globalVariables.applicationHomepage);
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
  
  var editMode = req.query['mode'] === 'edit';
  var requestedUserIsSessionUser = sessionInfo.userId === requestedUserId;
  
  application.getCurrentSessionUser(req, function(currentSessionUser) {

    userManager.getUser(requestedUserId, function (user) {
      if (user) {
        if (editMode) {
          //
          // Edit the user's info
          // 
          if (requestedUserIsSessionUser) {
            //
            // Must reenter password in this version of the site.
            //
            user.password = '';

            //
            // This may or may not be an example of a "closure" in Javascript.  The 
            // consensus seems to be that's when a function inside another function 
            // uses local variables from the outside function.  This can cause 
            // memory leaks in some circumstances, so be careful.
            //
            var renderPage = function (apiUser) {

              apiUser = apiUser || new ApiUser();

              //
              // todo: call a ".Sanitize()" method here to htmlencode the user info for display
              //

              var pageVars = {
                title: 'Edit Profile',
                user: user,
                currentSessionUser: currentSessionUser,
                apiuser: apiUser
              }

              res.render('userAddEdit', pageVars);
            }

            var action = req.param('action');

            if (action === 'createapikey') {
              userManager.upsertApiUser(new ApiUser({ associatedUserId:user.id }), renderPage);
            } else {
              userManager.getApiUserByUserId(sessionInfo.userId, renderPage);
            }

          } else {
            throw 'Editing other users not implemented';
          }
        } else 
        {
          //
          // View user's info
          //
          var safeUser = application.getSanitizedUser(user);

          var pageVars = {
            title: util.format('%s\'s Profile', user.name),
            
            displayUser: safeUser,
            showQrCode: requestedUserIsSessionUser
          }

          function renderIt() {
            
            application.buildApplicationPagevars(req, pageVars, function(pageVars) {
              res.render('userView', pageVars);
            });
          }

          if (requestedUserIsSessionUser) {
            userManager.getUserContaggs(currentSessionUser.id, function(userContaggIdList) {
              
              if (userContaggIdList && userContaggIdList.length > 0) {
                
                var safeContaggs = [];
                
                userManager.populateUserContaggs(userContaggIdList, function(userContaggs) {
                  
                  userContaggs.forEach(function(userContagg) {
                    safeContaggs.push(application.getSanitizedUser(userContagg));
                  });
                
                  pageVars.contaggs = safeContaggs;
                  
                  renderIt();
                });
              } else {
                renderIt();
              }
            });
          } else {
            renderIt();
          }
        }
      } else {
        res.send(404, 'Sorry, that user is not found.');
      }
    });
  });
  
}

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

  var initialPageVars = { title: 'My Attended Events', loginDest: '/myattendedevents' };
  var userId = application.getCurrentSessionUserId(req);

  if (!userId) {
    console.log('(warning) aint got a user id');
    
    done();
  } else {
    
    userManager.getUserEventsAttended(userId, function(userEvents) {

      if (userEvents && userEvents.length > 0) {

        userManager.populateEvents(userEvents, function(events) {

          if (events) {
            initialPageVars.events = events;
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
    loginDest: application.links.editprofile,
    usesAngular: true
  };
  
  application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
    res.render('useredit', pageVars);
  });
}

exports.viewProfile = function(req, res) {

  application.getCurrentSessionUser(req, function(user) {

    var initialPageVars = {
      title: 'View My Profile',
      loginDest: application.links.viewprofile,
      displayUser: user,
      isLoggedInUser: true
    };

    application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
      res.render('userView', pageVars);
    });
  });
  
  
}