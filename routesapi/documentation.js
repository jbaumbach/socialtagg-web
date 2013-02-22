/**
 * api documentation
 */

var globalfunctions = require('./../common/globalfunctions')
  , userManager = require('./../data/userManager')
  , util = require('util')
  , ApiUser = require('../models/ApiUser')
  ;

exports.index = function(req, res) {

  var pageVars =
  {
    title: 'API Documentation'
  };

  var sessionInfo = globalfunctions.getSessionInfo(req);

  function finalRender(apiUser) {
    var apiUser = apiUser || new ApiUser({ apiKey:'yourkey', password:'yourpassword'});

    //
    // todo: update these with values read from config settings
    //
    //var host = 'http://localhost:3000';
    var host = 'http://www.socialtagg.com';
    //
    // List of all API operations here
    //
    pageVars.operations = [
      prepareDoc(host, apiUser, userGet),
      prepareDoc(host, apiUser, userPostActionVerificationEmail)
    ];

    pageVars.apiUser = apiUser;
    
    res.render('apidocumentation', pageVars);
  }

  if (sessionInfo.userId) {
    userManager.getApiUserByUserId(sessionInfo.userId, function(apiUser) {
      finalRender(apiUser);
    });
  } else {
    finalRender(undefined);
  };
};

function prepareDoc(host, apiUser, docInfo) {
  return {
    title: docInfo.title,
    description: docInfo.description,
    signature: util.format('%s%s', host, docInfo.path),

    //
    // Insert the users credentials if we have them
    //
    // -H \'Accept: application/json\' 
    tryit: util.format('curl -H \'Authorization: CustomAuth apikey=%s, hash=\'$(php -r \'echo hash("sha256","%s" . "%s" . time());\') %s%s', apiUser.apiKey, apiUser.apiKey, apiUser.password, host, docInfo.path)
  };
}


//******************************************************************
// API Functions
//******************************************************************

// DRY alert: I feel that this can be integrated with an overall list of operations
// contained somewhere, and the values can be used to populate the API routes, 
// perform authorization, and generate the documentation.  Sweet!

var userGet =  {
  title:'Get User Info',
  description:'Retrieves and returns a user from the database.',
  path: '/apiv1/users/{user_id}'
};

var userPostActionVerificationEmail = {
  title: 'Send Account Verification Email',
  description: 'Sends the initial verification email to a new user.',
  path: '/apiv1/users/{user_id}?action=verificationemail&verificationcode={verification_code}'
}