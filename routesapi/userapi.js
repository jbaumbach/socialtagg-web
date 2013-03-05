/**
 * UserApi: api endpoints for user operations
 */

var userManager = require('./../data/userManager')
  , util = require('util')  
  , globalfunctions = require('./../common/globalfunctions')
  , User = require('./../models/User')
  , check = require('validator').check
  , thisModule = this
  ;


//*****************************************************************************
// Private functions
//*****************************************************************************


function respond(res, responseCode, response) {
  res.format({
    json: function() { 
      //
      //   The objects dumped include internal variables too, might want to sanitize them.
      //
      res.json(responseCode, JSON.stringify(response)); 
    }
  });
}

//
// Send an email via Mandrill
//
function sendEmail(postData, resultCallback) {

  var https = require('https');
  var response = '';

  var options = {
    hostname: 'mandrillapp.com',
    port: 443,
    path: '/api/1.0/messages/send.json',
    method: 'POST'
  };

  var req = https.request(options, function(apiRes) {
    apiRes.on('data', function(data) {
      response += data;
    });

    apiRes.on('end', function() {
      console.log('Mandrill response: ' + util.inspect(response));

      resultCallback(false, response);
    });
  });

  req.write(JSON.stringify(postData));

  req.on('error', function(e) {
    console.log('Error sending email: ' + e);
    resultCallback(true, 'error');
  });

  //
  // It's not super clear, but I believe this kicks off the request
  //
  req.end();

}

//
// Various templates for emails to send
//

function sendVerificationEmail(emailAddr, verificationCode, resultCallback) {
  //
  // Todo: make this a template on Mandrill's side, and use variables from config file
  //
  var postData = {
    "key" : "d45dd60c-7dc4-4b1b-8857-86c791e068c1",
    "message" : {
      "subject" : "Welcome to SocialTagg!",
        "text" : util.format("Hello %s!\n\nWelcome to SocialTagg!\n\nYour " +
          "verification code is %s. Please enter this code on the verification screen " +
          "in the mobile app to gain access to the app.\n\nSincerely,\nSocialTagg Team",
          emailAddr, verificationCode),
        "from_email" : "support@socialtagg.com",
        "preserve_recipients" : false,
        "from_name" : "SocialTagg Support Team",
        "to" : [
        {
          "email" : emailAddr
        }
      ],
      "html" : util.format("<body>Hello %s!<br \/><br \/>Welcome to SocialTagg!<br \/>" +
        "<br \/>Your verification code is %s. Please enter this code on the " +
        "verification screen in the mobile app to gain access to the app.<br \/>" +
        "<br \/>Sincerely,<br \/>SocialTagg Team<\/body>", emailAddr, verificationCode)
    } 
  }

  sendEmail(postData, resultCallback);
}

function sendForgotPasswordEmail(emailAddr, verificationCode, resultCallback) {
  //
  // Todo: make this a template on Mandrill's side, and use variables from config file
  //
  var postData = {
    "key" : "d45dd60c-7dc4-4b1b-8857-86c791e068c1",
    "message" : {
      "subject" : "Reset SocialTagg Password",
      "text" : util.format("Hello %s,\n\nA reset password request has been made for " +
        "this email address.\n\nYour " +
        "verification code is %s. Please enter this code on the forgot password screen " +
        "in the mobile app to reset your password.\n\nSincerely,\nSocialTagg Team",
        emailAddr, verificationCode),
      "from_email" : "support@socialtagg.com",
      "preserve_recipients" : false,
      "from_name" : "SocialTagg Support Team",
      "to" : [
        {
          "email" : emailAddr
        }
      ],
      "html" : util.format("<body>Hello %s,<br \/><br \/>A reset password request has been made for<br \/>" +
        "<br \/>this email address. Your verification code is %s. Please enter this code on the " +
        "forgot password screen in the mobile app to reset your password.<br \/>" +
        "<br \/>Sincerely,<br \/>SocialTagg Team<\/body>", emailAddr, verificationCode)
    }
  }

  sendEmail(postData, resultCallback);
}

//
// Validate parameters for the calls
//
function handleUserVerificationEmailRequest(options, res) {
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
    respond(res, 400, 'The \'verificationcode\' parameter is missing');
  } else if (!userEmail) {
    respond(res, 400, 'The \'useremail\' parameter is missing');
  } else {
    sendVerificationEmail(userEmail, verificationCode, function (err, response) {
      if (err) {
        respond(res, 500, 'There was an error sending the email.');
      } else {
        respond(res, 200, response);
      }
    });
  }
}


function handleForgotPasswordEmailRequest(options, res) {

  //todo: test this
  
  var userEmail = options.useremail;

  if (!userEmail) {
    respond(res, 400, 'The \'useremail\' parameter is missing');
  } else {
    var temp = util.format('%d', new Date());
    var length = 6;
    var verificationCode = temp.substr(temp.length - length);
    
    sendForgotPasswordEmail(userEmail, verificationCode, function (err, response) {
      if (err) {
        respond(res, 500, 'There was an error sending the email.');
      } else {
        respond(res, 200, response);
      }
    });
  }
}


function handleResetPasswordRequest(options, res) {

  throw ('Not implemented!');

}


//
// Public functions
//

exports.list = function(req, res) {
  
  throw('not implemented!');
  
};

exports.detail = function(req, res) {
  var requestedUserId = req.params.id;

  userManager.getUser(requestedUserId, function(user) {
    if (user) {
      respond(res, 200, user);
    } else {
      respond(res, 404, util.format('user id \'%s\' not found', requestedUserId));
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
      handleUserVerificationEmailRequest(options, res);
    } else if (actionMode === 'forgotpasswordemail') {
      handleForgotPasswordEmailRequest(options, res);
    } else if (actionMode === 'resetpassword') {
      handleResetPasswordRequest(options, res);
    } else {
      respond(res, 403, util.format('\'action\' value of \'%s\' is not allowed', actionMode)); 
    }
  } else {
    respond(res, 400, 'The \'action\' parameter is missing. The request cannot be fulfilled.  Sorry.');
  }
};