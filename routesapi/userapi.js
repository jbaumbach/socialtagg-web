/**
 * UserApi: api endpoints for user operations
 */

var userManager = require('./../data/userManager');
var util = require('util');
var globalfunctions = require('./../common/globalfunctions');
var User = require('./../models/User');

//
// Private functions
//

function respond(res, responseCode, response) {
  res.format({
    json: function() { 
      //
      // 2 things
      //   Stringify escapes everything, not sure if that's what we want
      //   The objects dumped include internal variables too, might want to sanitize them.
      //
      res.json(responseCode, JSON.stringify(response)); 
    }
  });
}

function sendVerificationEmail(user, verificationCode, resultCallback) {
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
          user.name, verificationCode),
        "from_email" : "support@socialtagg.com",
        "preserve_recipients" : false,
        "from_name" : "SocialTagg Support Team",
        "to" : [
        {
          "email" : user.email
        }
      ],
      "html" : util.format("<body>Hello %s!<br \/><br \/>Welcome to SocialTagg!<br \/>" +
        "<br \/>Your verification code is %s. Please enter this code on the " +
        "verification screen in the mobile app to gain access to the app.<br \/>" +
        "<br \/>Sincerely,<br \/>SocialTagg Team<\/body>", user.name, verificationCode)
    } 
  }

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

exports.postDetail = function(req, res) {
  var requestedUserId = req.params.id;
  var actionMode = req.query.action || undefined;

  userManager.getUser(requestedUserId, function(user) {
    if (user) {
      // 
      // Handle actions
      //
      if (actionMode) {
        if (actionMode === 'verificationemail') {
          var verificationCode = req.query.verificationcode;
          
          if (!verificationCode) {
            respond(res, 400, 'The \'verificationcode\' parameter is missing');
          } else {
            sendVerificationEmail(user, verificationCode, function(err, response) {
              if (err) {
                respond(res, 500, 'There was an error sending the email.'); 
              } else {
                respond(res, 200, response);
              }
            });
          }
        } else {
          respond(res, 403, util.format('\'action\' value of \'%s\' is not allowed', actionMode)); 
        }
      }
      
    } else {
      respond(res, 404, util.format('user id \'%s\' not found', requestedUserId));
    }
  });
};