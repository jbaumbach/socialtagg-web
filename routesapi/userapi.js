/**
 * UserApi: api endpoints for user operations
 */

var userManager = require('./../data/userManager')
  , util = require('util')  
  , globalfunctions = require('./../common/globalfunctions')
  , User = require('./../models/User')
  , check = require('validator').check
  , application = require('./../common/application')
  , email = require('./../common/email')
  , sprintf = require("sprintf-js").sprintf
  , fs = require('fs')
  , _ = require('underscore')
  , async = require('async')
  , thisModule = this
  ;

var fromEmail = 'support@socialtagg.com';
var fromName = 'SocialTagg Support Team';


exports.respond = function(res, responseCode, response) {
  res.format({
    json: function() { 
      //
      //  If you pass user objects, they're dumped including internal 
      //  variables too, might want to sanitize them.
      //
      res.json(responseCode, response);
    }
  });
}

//
// Various templates for emails to send
//
exports.sendVerificationEmail = function(emailAddr, verificationCode, resultCallback) {

  var params = {
    subject : "Welcome to SocialTagg!",
    plainTextBody : util.format("Hello %s!\n\nWelcome to SocialTagg!\n\nYour " +
      "verification code is %s. Please enter this code on the verification screen " +
      "in the mobile app to gain access to the app.\n\nSincerely,\nSocialTagg Team",
      emailAddr, verificationCode),
    toEmail : emailAddr,
    fromEmail : fromEmail,
    fromName: fromName,

    templateName : "socialtagg-create-account",
    mergeVars : [
      {
        "name" : "verification_code",
        "content" : verificationCode
      },
      {
        "name" : "email",
        "content" : emailAddr
      }
    ]
  };

  email.sendGenericEmail(params, resultCallback);
}

//
// Various templates for emails to send
//
exports.sendVerificationEmailWebsite = function(emailAddr, verificationUrl, resultCallback) {

  var params = {
    subject : "Welcome to SocialTagg!",
    plainTextBody : util.format("Hello %s!\n\nWelcome to SocialTagg!\n\n\Your " +
      "registration is nearly complete.  Please click this link (or copy/paste it into " +
      "your browser's url box) to complete the process:\n\n%s\n\n" +
      "Sincerely,\nSocialTagg Team",
      emailAddr, verificationUrl),
    toEmail : emailAddr,
    fromEmail : fromEmail,
    fromName: fromName
  };

  email.sendGenericEmail(params, resultCallback);
}


exports.sendForgotPasswordEmail = function(emailAddr, verificationCode, resultCallback) {
  
  var params = {
    subject : "Reset SocialTagg Password",
    plainTextBody : util.format("Hello %s,\r\n\r\nA reset password request has been made for " +
      "this email address.\r\nYour " +
      "verification code is %s. Please enter this code on the forgot password screen " +
      "in the mobile app to reset your password.\r\n\r\nSincerely,\r\nSocialTagg Team",
      emailAddr, verificationCode),
    toEmail : emailAddr,
    fromEmail : fromEmail,
    fromName: fromName,

    htmlBody : util.format("<body>Hello %s,<br \/><br \/>A reset password request has been made for<br \/>" +
      "this email address. Your verification code is %s. Please enter this code on the " +
      "forgot password screen in the mobile app to reset your password.<br \/>" +
      "<br \/>Sincerely,<br \/>SocialTagg Team<\/body>", emailAddr, verificationCode)

  };

  email.sendGenericEmail(params, resultCallback);
}

//
// Send the update profile email to a user
//
exports.sendUpdateProfileEmail = function(user, resultCallback) {
  
  var params = {
    subject : "SocialTagg Profile Updated!",
    plainTextBody : util.format("Hi %s!\n\nThank you for updating your SocialTagg " +
      "profile!\n\nYou can access your updated badge on the \"Badge\" screen " +
      "within the SocialTagg app.\n\nSincerely,\nSocialTagg Team",
      user.firstName),
    toEmail : user.email,
    fromEmail : fromEmail,
    fromName: fromName,

    templateName : "socialtagg-profile",
    mergeVars : [
      {
        "name" : "twitter",
        "content" : user.twitter
      },
      {
        "name" : "title",
        "content" : user.title
      },
      {
        "name" : "url",
        "content" : user.website
      },
      {
        "name" : "badge_image_url",
        "content" : user.qrCodeUrl
      },
      {
        "name" : "bio",
        "content" : user.bio
      },
      {
        "name" : "postal_address",
        "content" : user.address
      },
      {
        "name" : "last_name",
        "content" : user.lastName
      },
      {
        "name" : "email",
        "content" : user.email
      },
      {
        "name" : "company",
        "content" : user.company
      },
      {
        "name" : "picture",
        "content" : user.pictureUrl
      },
      {
        "name" : "tel",
        "content" : user.phone
      },
      {
        "name" : "first_name",
        "content" : user.firstName
      },
      {
        "name" : "uuid_avatar_image",
        "content" : user.avatarId
      }
    ]
  };
  
  email.sendGenericEmail(params, resultCallback);
}

//
// Validate parameters for the calls
//
exports.handleUserVerificationEmailRequest = function(options, res) {
  /* todo: try to use this library if Chris O. responds to JB's question
   //
   // Response if there are any invalid parameters
   //
   req.onValidationError(function(msg) {
   respond(res, 400, msg);
   });

   req.check('verificationcode', 'The \'verificationcode\' parameter is missing').notNull();
   req.check('useremail', 'The \'useremail\' parameter is missing or invalid').notNull().isEmail();
   */


  var verificationCode = options.verificationcode;
  var userEmail = options.useremail;

  if (!verificationCode) {
    thisModule.respond(res, 400, 'The \'verificationcode\' parameter is missing');
  } else if (!userEmail) {
    thisModule.respond(res, 400, 'The \'useremail\' parameter is missing');
  } else {
    thisModule.sendVerificationEmail(userEmail, verificationCode, function (err, response) {
      if (err) {
        thisModule.respond(res, 500, 'There was an error sending the email.');
      } else {
        thisModule.respond(res, 200, response);
      }
    });
  }
}


exports.handleForgotPasswordEmailRequest = function(options, res) {

  var userEmail = options.useremail;

  if (!userEmail) {
    thisModule.respond(res, 400, 'The \'useremail\' parameter is missing');
  } else {
    application.getAndSetVerificationCodeForUserByEmail(userEmail, function(err, code) {

      switch (err) {
        case 0:
          thisModule.sendForgotPasswordEmail(userEmail, code, function (err, response) {
            if (err) {
              thisModule.respond(res, 500, 'There was an error sending the email.  Please check the logs at this date/time.');
            } else {
              thisModule.respond(res, 200, response);
            }
          });
          break;
        case 1:
          thisModule.respond(res, 404, util.format('The email addr \'%s\' was not found', userEmail));
          break;
        case 2:
          thisModule.respond(res, 500, 'Internal server error, please try again laterl')
          break;
      }
      
    });
  }
}

/**
 * Handles a checkin or registration action for a user and an event.
 * 
 * @param options - object with these properties:
 *  eventId - the event id
 *  userId - the user id
 *  action - either 'checkinUser' or 'registerUser'
 *  
 * @param res - the response object.  This function will go ahead and close out the request.
 */
exports.handleUserEventAction = function(options, res) {

  var eventId = options.eventId;
  var userId = options.userId;

  async.waterfall([
    function(cb) {

      if (!userId) {
        cb({ status: 400, msg: 'userId not supplied' });
      } else if (!eventId) {
        cb({ status: 400, msg: 'eventId not supplied' });
      } else {
        cb();
      }
    }, 
    function(cb) {
      //
      // Here are all the possible operations we can do here and their userManager methods
      //
      var operation = {
        checkinUser: userManager.checkinUserToEvent,
        registerUser: userManager.registerUserToEvent
      };
      
      if (operation[options.action]) {
        operation[options.action](userId, eventId, function(err) {
          if (err) {
            cb({status: err.status || 500, msg: err.msg || err });
          } else {
            cb();
          }
        });
      } else {
        cb({status: 400, msg: 'unsupported operation: ' + options.action });
      }
    }
  ], function(err, result) {
    if (err) {
      res.send(err.status, { msg: err.msg });
    } else {
      res.send(200);
    }
  });
}

//
// We need POSTed by JSON:
//
//  useremail: email address of user
//  originalcode: original code set in reset pw call
//  newpassword: new password to set
//
exports.handleResetPasswordRequest = function(options, res) {

  var userEmail = options.useremail;
  var originalCode = options.originalcode;
  var newPass = options.newpassword;
  
  if (!userEmail) {
    thisModule.respond(res, 400, 'The \'useremail\' parameter is missing');
  }
  else if (!originalCode) {
    thisModule.respond(res, 400, 'The \'originalcode\' parameter is missing');
  }
  else if (!newPass) {
    thisModule.respond(res, 400, 'The \'newpassword\' parameter is missing');
  } else {
    userManager.setUserPasswordWithVerificationCodeByEmail(userEmail, originalCode, newPass, function(err) {

      switch (err) {
        case 0:
          thisModule.respond(res, 200, 'Password updated successfully');
          break;
        case 1:
          thisModule.respond(res, 404, util.format('The email addr \'%s\' was not found', userEmail));
          break;
        case 2:
          thisModule.respond(res, 500, 'Internal server error, please try again laterl')
          break;
        case 3:
          thisModule.respond(res, 404, 'The verification code was incorrect');
          break;
      }
    });
  }
}

//
// We need POSTed by JSON:
//
//  useruuid: the user's uuid
//
exports.handleUpdateProfileEmailRequest = function(options, res) {

  var userUuid = options.useruuid;

  if (!userUuid) {
    thisModule.respond(res, 400, 'The \'useruuid\' parameter is missing');
  } else {

    userManager.getUser(userUuid, function(user) {
      if (user) {

        //
        // We have a valid user.  
        //
        if (!user.email || user.email.length == 0) {
          thisModule.respond(res, 400, 'The user was found but has no email address');
        } else {
          
          //
          // Houston, the eagle has landed.
          //
          thisModule.sendUpdateProfileEmail(user, function(err, response) {
            if (err) {
              thisModule.respond(res, 500, 'There was an error sending the email.');
            } else {
              thisModule.respond(res, 200, response);
            }
          }); 
        }
        
      } else {
        thisModule.respond(res, 404, util.format('user id \'%s\' not found', userUuid));
      }
    });

  }
}


exports.list = function(req, res) {
  
  throw('not implemented!');
  
};

exports.detail = function(req, res) {
  var requestedUserId = req.params.id;

  userManager.getUser(requestedUserId, function(user) {
    if (user) {
      thisModule.respond(res, 200, user);
    } else {
      thisModule.respond(res, 404, util.format('user id \'%s\' not found', requestedUserId));
    }
  });
};

exports.validateRawUser = function(userRaw, options) {
  
  var v = application.ErrorCollectingValidator();
  options = options || {};
  
  //
  // These fields are required
  //
  v.check(userRaw.firstName, 'first name should be between 1 and 50 chars').len(1, 50);
  v.check(userRaw.lastName, 'last name should be between 1 and 50 chars').len(1, 50);
  
  if (options.checkEmail) {
    v.check(userRaw.email, 'email should be present and valid').isEmail();
  }
  
  // Only check password if this is an insert
  if (!userRaw.id) {

    v.check(userRaw.password, 'password should be between 6 and 15 chars').len(6, 15);

    if (userRaw.password != userRaw.password2) {
      v.error('the passwords should match');
    }
  }
  
  if (userRaw.website) {
    v.check(userRaw.website, 'website should be valid').isUrl();
  }
  
  return v.getErrors();
};


function completeUserSubmission(userRaw, options) {

  // Validate info 
  var invalidDataMsgs = thisModule.validateRawUser(userRaw);

  if (invalidDataMsgs.length > 0) {

    options.res.send(400, { errors: invalidDataMsgs });

  } else {

    // Ahhh, data all good

    userManager.upsertUser(userRaw, function (err, updatedUser) {

      if (err) {

        // Huh
        options.res.send(500, { msg: err });

      } else {

        //
        // Sweet. The user is created.
        //
        
        //
        // Hideous hack - auto log the user in if there's no logged in user and
        // a password is passed, because we're assuming
        // this is the registration step.
        //
        var loggedInUserId = application.getCurrentSessionUserId(options.req);
        
        if (!loggedInUserId && userRaw.password) {
          console.log('logging user in');
          globalfunctions.loginUser(options.req, updatedUser.id);
        }
        
        options.res.send(200, updatedUser);

      }
    });
  }
}

/* 
 Accept a user object and insert it into the database.  As of this writing, the 
 user must be the currently logged in user.
 */
exports.usersPut = function(req, res) {

  var uuid = req.params.id;
  var loggedInUserId = application.getCurrentSessionUserId(req);
  
  var authorizedToPutThisUser = (uuid === loggedInUserId);

  if (!authorizedToPutThisUser) {
    res.send(403, { msg: 'Current user has insufficient permissions to edit submitted user id' });
    return;
  };
  
  var userRaw = req.body;
  //
  // We don't support changing userid or email at this time.  Just in case the user
  // got cute and used Firebug or something to change these values in the client, let's zap 
  // them
  //
  // todo: test this!
  //
  userManager.getUser(loggedInUserId, function(user) {
    
    userRaw.email = user.email;
    userRaw.userName = user.email;

    var options = { req: req, res: res };

    completeUserSubmission(userRaw, options);
  })

}

var handleUserCreateAndCheckin = exports.handleUserCreateAndCheckin = function(options, res) {
  //console.log('handleUserCreateAndCheckin: ' + util.inspect(options, {depth:null}));

/* Example of options object (posted by Angular & possibly added to): 
  { action: 'createAndCheckin',
    eventId: 'd295e83a-0f8a-11e3-a682-2346c22487a2',
    firstName: 'fred',
    lastName: 'jones',
    email: 'uggabugga@',
    company: 'co',
    title: 'title' }
*/
  
  
  var userRaw = options;
  var newUser;
  
  async.waterfall([

    function validateUser(cb) {
      var invalidDataMsgs = thisModule.validateRawUser(userRaw, { checkEmail: true });
      if (invalidDataMsgs.length > 0) {
        cb({ status: 400, msg: invalidDataMsgs });
      } else {
        cb();
      }
    }, 
    function checkForExistingUser(cb) {
      userManager.getUserByEmail(userRaw.email, function(user) {
        if (user) {
          cb({ status: 400, msg: 'Sorry, that email address is already in use' });
        } else {
          cb();
        }
      });
    },
    function insertUser(cb) {
      userManager.upsertUser(userRaw, function(err, user) {
        newUser = user;
        if (err) {
          cb({ status: 500, msg: err });
        } else if(!user) {
          cb({ status: 500, msg: 'User not created, please contact support and/or try again later '});
        } else {
          cb();
        }
      });
    },
    function sendWelcomeEmail(cb) {
      if (options.sourceType == 'eventOwner') {
        console.log('todo: sending welcome email');
        cb();
      } else {
        console.log('bah, not going to send welcome email');
        cb();
      }
    },
    function registerUser(cb) {
      userManager.registerUserToEvent(newUser.id, options.eventId, cb);
    },
    function checkinUser(cb) {
      userManager.checkinUserToEvent(newUser.id, options.eventId, cb);
    }
  ], function(err) {
    if (err) {
      res.send(err.status, { msg: err.msg });
    } else {
      res.send(201, newUser);
    }
  })
}

exports.usersPost = function(req, res) {
  //
  // todo: understand how Express parses the JSON post (asynchronously?)  
  //
  // Otherwise, a jackass sending a huge json file can bring the server to a standstill.
  //
  var options = req.body; 
  
  var actionMode = options.action || undefined;

  // 
  // Handle actions
  //
  if (actionMode) {
    if (actionMode === 'verificationemail') {
      thisModule.handleUserVerificationEmailRequest(options, res);
    } else if (actionMode === 'forgotpasswordemail') {
      thisModule.handleForgotPasswordEmailRequest(options, res);
    } else if (actionMode === 'resetpassword') {
      thisModule.handleResetPasswordRequest(options, res);
    } else if (actionMode === 'updatedprofileemail') {
      thisModule.handleUpdateProfileEmailRequest(options, res);
    } else if (actionMode === 'checkinUser' || actionMode === 'registerUser') {
      options.action = actionMode;
      thisModule.handleUserEventAction(options, res);
    } else if (actionMode === 'createAndCheckinByEventOwner') {
      options.sourceType = 'eventOwner';
      options.sourceId = options.eventId;
      thisModule.handleUserCreateAndCheckin(options, res);
    } else {
      thisModule.respond(res, 400, util.format('\'action\' value of \'%s\' is not allowed', actionMode)); 
    } 
  } else {
    
    //
    // We're inserting a user.  At this point, we should have a temporary login on the site
    // which authorized us to get at least to this point.
    //

    var userRaw = req.body;
    var tempUserEmail = globalfunctions.getTempLoginInfo(req);
    
    userRaw.email = tempUserEmail;
    userRaw.userName = tempUserEmail;

    var options = { req: req, res: res };
    completeUserSubmission(userRaw, options);


    // old line
    // thisModule.respond(res, 400, 'The \'action\' parameter is missing. The request cannot be fulfilled.  Sorry.');
  }
};

/*
  Returns the user's contaggs as a CSV file
 */
exports.contaggs = function(req, res) {

  var requestedUserId = req.params.id;

  userManager.getUserContaggs(requestedUserId, function(userContaggs) {
    if (userContaggs) {

      userManager.populateUserContaggs(userContaggs, function(users) {
        
        if (users) {
          
          application.buildUserExportFile(users, 'csv', function(err, data) {
            if (err) {
              thisModule.respond(res, 500, { msg: 'Internal error (' + err + ')'});
            } else {
              //
              // We got the data, let's return it
              //
              res.set({
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="mycontaggs.csv"'
              })
              
              res.send(200, new Buffer(data));
              
            }
          });
          
        } else {
          
          console.log('(error) exports.contaggs: no contaggs found for ' + requestedUserId);
          thisModule.respond(res, 500, { msg: 'Crud, could not populate list'});
        }
      });
      
    } else {
      thisModule.respond(res, 404, util.format('user id \'%s\' not found', requestedUserId));
    }
  });
}

/*
  Accept the submitted profile picture and upload it to the user's account.
  
  Notes:
  This doesn't appear possible with the current node.js component from usergrid.  The
  request bombs out with strange error.  See comment here:
    http://apigee.com/docs/usergrid/content/storing-and-retrieving-binary-data#comment-1381
  
  You'll probably have to roll your own API client:
    http://apigee.com/docs/usergrid/content/authentication-and-access-usergrid 
    
  todo: delete sample usergrid /assets records:
    select * where owner = "b66a00ee-73d3-11e2-95c4-02e81ae640dc"
  
 */
exports.uploadProfilePicture = function(req, res) {

  var maxFileSize = 350000;
  var fileInfo = req.files.uploadFile;
  var errStatus = 403;
  var err;
  var userId = req.params.id;
  var loggedInUserId = application.getCurrentSessionUserId(req);
  
  // Validate the file
  if (userId != loggedInUserId) {
    
    err = 'you are not authorized to do that';
    errStatus = 401;
    
  } else if (fileInfo.size == 0) {
    
    err = 'the file size is zero';
    
  } else if (fileInfo.size > maxFileSize) {
    
    err = 'the file size is larger than the maximum size (' + maxFileSize + ')';
    
  };
  
  
  if (err) {
    res.send(errStatus, { msg: err });
    
  } else {

    // Read the file, and send the bytes to the database

    fs.readFile(fileInfo.path, 'ascii', function(err, data) {
      
      if (err) {
        
        console.log('(error) userApi.uploadProfilePicture: there was an error reading the file: ' + err);
        
        res.send(500, { msg: 'there was an error saving the uploaded file, please try again later'});
        
      //} else if (fileInfo.size != ) {
        
      } else {

        // set the data to the user's picture
        
        var options = {
          userId: userId,
          data: data,
          fileName: fileInfo.name,
          mime: fileInfo.type
        }

        userManager.setUserProfilePicture(options, function(err, newImgUrl) {
          
          if (err) {

            res.send(500, { msg: 'there was an error processing the uploaded file, please try again later'});

          } else {

            res.send(200, { msg: 'hello there, the file has been submitted.' });
          }
        })
      }
    });
    
  }
}

exports.userActivity = function(req, res) {

  //
  // Async is kinda overkill here, but this func will prolly be extended out a bit
  //
  async.waterfall([
    function getUserCounts(cb) {

      var options = {
        dateRange: { weeks: 24 }
      }

      //
      // Note: options are ignored in the eventManager function (for now)
      //
      userManager.getUserCounts(options, function(err, users) {

        //
        // Group the results
        //
        var aggregateRows = application.getDataSummary(options, users); //getUserSummary(options, users);
        var total = _.size(users);

        cb(err, aggregateRows, total);
      })
    }
  ], function done(err, aggregateRows, total) {
    if (err) {
      res.send(err.statusCode, { msg: err.msg });
    } else {
      //
      // Put the results in a 'data' object.  This way, the results of .data can
      // be processed by the client without Angular's promise '$then' etc. being part
      // of the data result set.
      //
      res.send(200, { data: aggregateRows, overview: { total: total } });
    }
  })

}