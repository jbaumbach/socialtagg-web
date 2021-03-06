/**
 * api documentation
 */

var globalfunctions = require('./../common/globalfunctions')
  , userManager = require('./../data/userManager')
  , application = require('../common/application')
  , util = require('util')
  , ApiUser = require('../models/ApiUser')
  ;

//
// Display the index page
//
exports.index = function(req, res) {

  var pageVars =
  {
    title: 'API Documentation',
  };

  var sessionInfo = globalfunctions.getSessionInfo(req);

  //
  // Helper function to process operation output
  //
  function finalRender(apiUser) {
    var apiUser = apiUser || new ApiUser({ apiKey:'yourkey', password:'yourpassword'});

    //
    // todo: update these with values read from config settings
    //
    //var host = 'http://localhost:3000';
    var host = 'https://www.socialtagg.com';
    
    //
    // Convert API call values into displayable documentation values
    //
    pageVars.operations = [];
    apiFunctions.forEach(function(apiFunction) {
      pageVars.operations.push(prepareDoc(host, apiUser, apiFunction));
    });
    
    pageVars.apiUser = apiUser;

    application.buildApplicationPagevars(req, pageVars, function(pageVars) {
      res.render('apidocumentation', pageVars);
    });

  }

  //
  // Procss operation output, optionally adding the current user credentials
  //
  if (sessionInfo.userId) {
    userManager.getApiUserByUserId(sessionInfo.userId, function(apiUser) {
      finalRender(apiUser);
    });
  } else {
    finalRender(undefined);
  };
};

//
// Helper function to create the output data that the view will render
//
function prepareDoc(host, apiUser, docInfo) {
  var addtlCommand = '';
  var addtlHeader = '';
  var postBody = '';
  
  if (docInfo.postJson) {
    addtlHeader = ' -H \'Content-Type: application/json\'';
    postBody = util.format(' -d \'%s\'', docInfo.postJson);
    addtlCommand = ' -X POST';
  }

  return {
    title: docInfo.title,
    description: docInfo.description,
    signature: util.format('%s%s', host, docInfo.path),

    //
    // Insert the users credentials if we have them
    //
    tryit: util.format('curl %s%s%s -H \'Authorization: CustomAuth apikey=%s, hash=\'$(php -r \'echo hash("sha256","%s" . "%s" . time());\') "%s%s"',
      addtlCommand, addtlHeader, postBody, apiUser.apiKey, apiUser.apiKey, apiUser.password, host, docInfo.path)
  };
}


//******************************************************************
// API Functions
//******************************************************************

// DRY alert: I feel that this can be integrated with an overall list of operations
// contained somewhere else in the solution, and the values can be used to populate the API routes, 
// perform authorization, and generate the documentation.  Maybe even unit tests?

var apiFunctions = [ 
  {
    title:'Get User Info',
    description:'Retrieves and returns a user from the database.',
    path: '/apiv1/users/{user_id}'
  },

  {
    title: 'Send Account Verification Email',
    description: 'Sends the initial verification email to a new user.',
    path: '/apiv1/users',
    postJson: '{ "action": "verificationemail", "useremail": "the_user_email", "verificationcode": "the_user_verification_code" }'
  },
  
  {
    title: 'Send Forgot Password Email',
    description: 'Sends the forgot password email to a user.  The generated code should be supplied to the "reset password" API call',
    path: '/apiv1/users',
    postJson: '{ "action": "forgotpasswordemail", "useremail": "the_user_email" }'
  },

  {
    title: 'Verify and Reset User Password',
    description: 'Verifies the passed code, and if valid, sets the password to the passed password',
    path: '/apiv1/users',
    postJson: '{ "action": "resetpassword", "useremail": "the_user_email", "originalcode": "the_verification_code", "newpassword": "the_new_password" }'
  },

  {
    title: 'Send Updated Profile Email',
    description: 'Sends an email to the user confirming a profile update and includes profile data',
    path: '/apiv1/users',
    postJson: '{ "action": "updatedprofileemail", "useruuid" : "the_user_uuid" }'
  }
];