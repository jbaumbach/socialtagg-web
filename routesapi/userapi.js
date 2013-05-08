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
  , thisModule = this
  ;

var fromEmail = 'support@socialtagg.com';
var fromName = 'SocialTagg Support Team';



exports.respond = function(res, responseCode, response) {
  res.format({
    json: function() { 
      //
      //   The objects dumped include internal variables too, might want to sanitize them.
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
    } else {
      thisModule.respond(res, 403, util.format('\'action\' value of \'%s\' is not allowed', actionMode)); 
    } 
  } else {
    thisModule.respond(res, 400, 'The \'action\' parameter is missing. The request cannot be fulfilled.  Sorry.');
  }
};