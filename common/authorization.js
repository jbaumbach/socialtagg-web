/**
 * Authentication module
 * 
 * There are many possible ways to authenticate and authorize API calls.  Two existing
 * standards are "BasicAuthentication" and "DigestAuthentication".  Both have pros
 * and cons.
 * 
 * For our purposes, we want to:
 * 
 * - Ensure the caller is known to our system (passes credentials)
 * - Have valid credentials passed on every call (e.g. no challenge-response round trips)
 * - If we don't have SSL, ensure the password is not sent across the wire in plain 
 *   text (e.g. hashed or encrypted in some way)
 * - Ensure that if any requests are sniffed by an attacker, the request will eventually
 *   expire (e.g. timestamped).
 * 
 * A reasonable approach is to reuse the existing RFC specified "Authorization" header
 * and set up a simple custom authentication scheme.  Amazon and Google have taken
 * similar approaches, and some discussions can be found here.
 * 
 * https://developers.google.com/youtube/2.0/developers_guide_protocol_clientlogin
 * http://stackoverflow.com/questions/8042907/how-does-api-signature-authentication-work-as-implemented-by-mashery
 *
 * The signed url is good for a variable amount of minutes before it expires.  The
 * approach to validating the timestamp is to round the time to seconds, and not
 * require the client to separately send the timestamp.  We will assume that the
 * client and server have reasonably similar clock values, and that the request gets
 * to the server from the client within a short period of time < 2 seconds.
 * 
 * When we get the request, we loop through the seconds backwards and validate the
 * timestamp for each second.  If our assumptions are true, then we probably won't
 * loop more than 2 times for each request, keeping CPU usage reasonable (we have
 * to sha256 hash a string in each loop).  Obviously, the older the request then
 * the more work the server CPU has to do.  
 * 
 * One drawback with a custom header is that you can no longer test your API with 
 * a standard browser (although there are plugins that can help).
 * 
 * It's easy to test in curl however, here's a sample command line to grab some 
 * users:
 * 
 *  curl -H 'Accept: application/json' -H 'Authorization: CustomAuth apikey=your_key, hash='$(php -r 'echo hash("sha256","your_key"."your_password".time());') http://localhost:3000/apiv1/users/
 *  
 */
  
  
var globalFunctions = require('./globalfunctions')
  , userManager = require('../data/userManager')
  , util = require('util')
  , application = require('./application')
  , thisModule = this
  , _ = require('underscore')
  ;

//
// Search the passed header string and grab it's values if possible, returning
// them in an array of strings.
//
exports.getValsFromAuthHeader = function(headerString) {

  var result = headerString.match(/ *CustomAuth *apikey=(.*) *, *hash=(.*) */i);
  
  return result;
}

//
// Validate the passed hash value with the values from the passed api user.  Returns
// true if the hashed value is valid.  The hashed value must have been generated
// by the client within the last "validForMinutes" minutes.
//
exports.authorizeCredentials = function(hashedValue, apiUser, validForMinutes) {
  
  var result = false;
  var timestamp = Math.floor(new Date() / 1000);  // If your server's clock is consistently off you can add seconds here
  var minutes = Math.min(Math.max(1, validForMinutes), 10);  // validMinutes should be between 1 and 10
  var maxSecondsToSearch = 60 * minutes;
  var secondsToSearchForwardInTime = 60 * -3; // Go 3 minutes back
  
  for (var loop = secondsToSearchForwardInTime; loop <= maxSecondsToSearch; loop++) {
    
    var validValueToHash = util.format('%s%s%d', apiUser.apiKey, apiUser.password, timestamp - loop);
    var validValueHash = globalFunctions.sha256Encode(validValueToHash);
    
    if (hashedValue === validValueHash) {
      result = true;
      break;
    }
  }
  
  return result;
}

//
// Write an error to the response object, or call next, depending on whether
// there's an error object or not.
//
exports.authorizationComplete = function(error, req, res, next) {
  if (error) {
    //
    // Error message
    //
    res.format({
      json:function () {
        res.json(error.httpResponseCode, error.Message);
      }
    });

  } else {
    //
    // Successful authorization
    //
    next();
  }
}

/*
  Determine if we know who the requester is, either by session id or by HMAC
 */
exports.authenticate = function(req, res, next) {
  
  var sessionInfo = globalFunctions.getSessionInfo(req);

  if (sessionInfo.userId) {

    next();

  } else {

    thisModule.authenticateHmac(req, function(error, apiUser) {
      
      thisModule.authorizationComplete(error, req, res, next);

    });
  }
} 

//
// Temporary function - this should be in a database and programmatically maintained
//
var getAdmins = exports.getAdmins = function() {
  var admins = [
    'ea10dde9-8a1b-11e2-b0a7-02e81ac5a17b',   // John's Test User - Dont Modify
    '0a0f9599-9921-11e2-b8af-02e81ae640dc',   // Tim Feng
    '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8',   // Karim Varela
    'b66a00ee-73d3-11e2-95c4-02e81ae640dc',   // John Baumbach I
    '1bf34bfa-07c8-11e3-af5c-51a7c0a13fad',   // Louis Tang
    'f4dbf1b1-bc70-11e2-a65f-02e81afcd5fc',   // Karim Varela
    '9c1f4cda-e2d3-11e2-a4b4-3ba51af19848',   // Dubem Enyekwe
    '5b07c30a-082e-11e3-b923-dbfd8bf6ac23',   // Louis Tang
    '5893116a-275a-11e3-be34-f9ef93e2dea2',   // louis@socialtagg.com
    'b31e92da-4c8a-11e3-8e0d-213c6a3c1b66',   // ltgame@hotmail.com
    '532cc7a6-7679-11e2-96f4-02e81ac5a17b',   // Jade Shyu
    'd31fb37f-7428-11e2-a3b3-02e81adcf3d0',   // jade@socialtagg.com
    'c238c31a-2d6a-11e3-898d-85fbe15c5ce8',   // Joseph Mirandi
    '3d86497b-66c4-11e2-8b37-02e81ac5a17b',   // Jeff Mock
    '3dc6bd5a-563f-11e3-bf6e-7dcb156cd05b'    // Diana Cheung
  ];

  return admins;
}

var tempGetOtherExclusions = exports.tempGetOtherExclusions = function() {
  var undefines = [
    '420f013a-03f4-11e3-851f-a93a57d20d81',   // not in DB anymore?
    '71ebee1a-1bfd-11e3-98e1-3d6c4df5db3f',   // not in DB anymore?
    '7d6029fa-1027-11e3-bbbe-3f9c3726ead0'    // Alyson P. (beta tester)
  ];
  
  //
  // Non-socialtagg users who've created events as of 11/29/2013 11:48 AM:
  //  Adam Plimpton:      0ccaf7ea-2659-11e3-9cc9-37aa58c1f5ef
  //  d4cheung@gmail.com: 3dc6bd5a-563f-11e3-bf6e-7dcb156cd05b
  //
  
  return undefines;
} 

var getCurrentUsersGroup = exports.getCurrentUsersGroup = function(req, callback) {
  
  var result;
  
  var currentUserId = application.getCurrentSessionUserId(req);
    
  // temporary kluge: hard-coded ids of admins
  var admins = getAdmins();
    
  console.log('userid: ' + currentUserId);
  if (_.contains(admins, currentUserId)) {
    result = 'admin';
  }

  console.log('returning: ' + result);

  return result;
}

exports.authorize = function(accessType) {

  return function(req, res, next) {
    var errResult;
    
    //
    //
    // Which groups are required to access the passed access type
    var groupsRequiredForAccessType = {
      systemreports: ['admin']
    }

    var groupsRequired = groupsRequiredForAccessType[accessType];
    var currentUserGroup = getCurrentUsersGroup(req);
    
    console.log('gr: ' + util.inspect(groupsRequired) + ', cug: ' + util.inspect(currentUserGroup));
    
    if (groupsRequired) {
      if (_.contains(groupsRequired, currentUserGroup)) {
        //
        // All good!
        //
      } else {
        errResult = {
          statusCode: 401,
          msg: 'Sorry, your access level cannot access this resource type.'
        }
        console.log('(info) access level ' + currentUserGroup + ' is denied access to ' + accessType);
      }
    } else {
      errResult = {
        statusCode: 500,
        msg: 'Poor programming: unknown access type specified: ' + accessType
      }
    }
    
    if (errResult) {
      res.send(errResult.statusCode, { msg: errResult.msg });
    } else {
      next();
    }
  }
}

/*
  Same as .authenticate but also checks if there is a temporary authentication.
  This is useful for pages like 'Confirm Registration' where the user clicked
  a valid link sent by us via email but there's no user account yet.
 */
exports.authenticateTempOk = function(req, res, next) {

  var sessionInfo = globalFunctions.getSessionInfo(req);

  if (sessionInfo.userId) {

    next();

  } else if (sessionInfo.tempAuthorization) {
    
    next();
    
  } else {

    thisModule.authenticateHmac(req, function(error, apiUser) {

      thisModule.authorizationComplete(error, req, res, next);

    });
  }
  
}

/*
  Authenticates a request using HMAC. 
  Parameters:
    req: the current request
    callback: a callback with this signature:
      error: filled in with an object to return to the response if invalid, otherwise false
      apiUser: filled in with the api user object if credentials are good
 */
exports.authenticateHmac = function(req, callback) {
  var error;

  //
  // Descriptive string to pass to client in an error message in case something goes wrong
  //
  var expectedDesc = 'Authorization: CustomAuth apikey=your_key, hash=sha256(your_key+your_password+seconds_since_epoch)';

  var requestValidForMins = 5;

  var authHeader = req.header('Authorization');

  if (!authHeader) {

    error = {
      httpResponseCode: 401,
      Message: 'Missing \'Authorization\' header.  Expected: ' + expectedDesc
    }
  }

  if (!error) {

    var userVals = thisModule.getValsFromAuthHeader(authHeader.toLowerCase());

    if (!userVals || !userVals[1] || !userVals[2]) {
      error = {
        httpResponseCode: 401,
        Message: 'Unable to retrieve "apikey" or "hash" authorization header values.  Expected: ' + expectedDesc
      }
    }
  }

  if (!error) {
    //
    // Authorize the apiUser
    //
    var password = userManager.getApiUser(userVals[1], function(apiUser) {

      if (!apiUser) {

        error = {
          httpResponseCode: 401,
          Message: util.format('Unknown user \'%s\' or invalid password', userVals[1])
        }

      } else {

        var isAuthorized = thisModule.authorizeCredentials(userVals[2], apiUser, requestValidForMins);

        if (!isAuthorized) {
          error = {
            httpResponseCode: 401,
            Message: util.format('Unknown user \'%s\', invalid password, or invalid/expired timestamp', userVals[1])
          }
        }

        //
        // If no error by here, we're valid!
        //
      }

      //thisModule.authorizationComplete(error, req, res, next);
      callback(error, apiUser);
    });

  } else {

    //
    // We have an error
    //
    // thisModule.authorizationComplete(error, req, res, next);
    callback(error);
  }
  
};

//
// Note: Deprecated: call "authenticate" instead.
// 
// Authenticate and authorize an api call.  Call next() if ok, otherwise 
// write an error to response.
//
exports.authorizeOld = function(req, res, next) {
  
  thisModule.authenticateHmac(req, function(error, apiUser) {

    thisModule.authorizationComplete(error, req, res, next);
    
  });
  
}

//
// Verify that there is a logged in user via session
//
exports.sessionIdAuthenticate = function(req, res, next) {

  var sessionInfo = globalFunctions.getSessionInfo(req);

  if (sessionInfo.userId) {
    
    next();
  
  } else {

    res.json(401, { description: 'No logged in user' } );

  }
}

/*
 Determine if a user is logged in.  If so, call 'next()', otherwise redirect to login page
 and come back to this page when complete.
 */
exports.requireLogin = function(req, res, next) {

  var sessionInfo = globalFunctions.getSessionInfo(req);

  if (!sessionInfo.userId) {

    var options = { logindest: req.url };
    var l = application.links(options);

    //
    // Don't do a 301 here (permanent).  Do a 302 (temporary/GET).  302 same as 303 is in http 1.1 and later.
    //
    res.writeHead(302, { 'Location': l.login });
    res.end();

  } else {

    //
    // We're golden - continue
    //
    next();
  }

}