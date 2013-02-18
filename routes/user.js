
/*
 * User - controllers
 */

var userManager = require('./../data/userManager')
  , util = require('util')
  , globalfunctions = require('./../common/globalfunctions')
  , User = require('../models/User')
  , ApiUser = require('../models/ApiUser')
  , application = require('../common/application')
  ;

exports.loginForm = function(req, res) {
  var pageVars = {
    title: 'User Login'
  };
  res.render('userLogin', pageVars);
};

exports.login = function(req, res) {
  var email = req.body.email;

  // only hash password if we're storing it oursevles: globalfunctions.hashPassword(req.body.password);
  var password = req.body.password; 

  userManager.validateCredentials(email, password, function(user) {
    
    if (user) {
      //
      // User validated successfully.  
      //
      globalfunctions.loginUser(req, user.id);
      res.redirect(applicationHomepage);
    } else {
      //
      // Oops, something went wrong.  Login is a post, but doesn't affect the database, so 
      // ok to re-render the page with the existing post data rather than our usual
      // redirect nonsense.
      //
      var delayMs = 0;
      var todoAfterAShortDelay = function() {
        res.render('userLogin', { title: 'User Login', error: 'Incorrect email or password' });
      };
      setTimeout(todoAfterAShortDelay, delayMs);
    }
  })
}

exports.logout = function(req, res) {
  globalfunctions.logoutUser(req);
  res.redirect(applicationHomepage);
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
            user: safeUser,
            currentSessionUser: currentSessionUser
          }

          function renderIt() {
            res.render('userView', pageVars);
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
