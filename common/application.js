/**
 * User: jbaumbach
 * Date: 2/10/13
 * Time: 1:50 PM
 * 
 * Application-specific functions
 * 
 */

var util = require('util')
  , userManager = require('../data/userManager')
  , User = require('../models/User')
  , globalFunctions = require('./globalfunctions')
  , check = require('validator').check
  , sanitize = require('validator').sanitize
  , thisModule = this
  ;

//
// Grabs the current user from the session or returns an empty object to the callback.
//
exports.getCurrentSessionUser = function(req, callback) {
  var sessionInfo = globalFunctions.getSessionInfo(req);

  var returnResult = function(user) {
    callback(user);
  };
  
  if (sessionInfo.userId) {
    userManager.getUser(sessionInfo.userId, function(user) {
      returnResult(user);
    });
  } else {
    returnResult({});
  }
};

//
// Get login status.  Results are as follows:
//
// 0: anonymous user
// 1: cookied user, but not logged in
// 2: logged in user
//
exports.loginStatus = function(req) {
  var sessionInfo = globalFunctions.getSessionInfo(req);
  
  if (!(sessionInfo && sessionInfo.userId)) {
    // 
    // todo: implement username in cookie if user selects "remember me".  Right now there is no cookie!
    //
    var cookied = false;
    
    if (cookied) {
      return 1;
    } else {
      return 0;
    }
  } else {
    return 2;
  }
};

//
// Generate a random verification code 
//
exports.getForgotPasswordEmailVerificationCode = function() {
  var temp = util.format('%d', new Date());
  var length = 6;
  var result = temp.substr(temp.length - length);

  return result;
}

//
// Generate a verification code, save it in database for user with passed
// email address, and return it.
//
// Callback params: err  (0 = no error, 1 = user not found, 2 = db error)
//                  code (the verification code)
//
exports.getAndSetVerificationCodeForUserByEmail = function(userEmail, callback) {
  
  var code = thisModule.getForgotPasswordEmailVerificationCode();

  userManager.setUserVerificationCodeByEmail(code, userEmail, function(err) {
    callback(err, code);
  });
};


//
// Sanitization functions
//
exports.getSanitizedUser = function(rawUser) {
  var sanitizedData = {
    id: rawUser.id,
    userName: sanitize(rawUser.userName).entityEncode(),
    name: sanitize(rawUser.name).entityEncode().truncate(255, true, '...'),
    firstName: sanitize(rawUser.firstName).entityEncode().truncate(255, true, '...'),
    lastName: sanitize(rawUser.lastName).entityEncode().truncate(255, true, '...'),
    address: sanitize(rawUser.address).entityEncode().truncate(1024, true, '...'),
    email: sanitize(rawUser.email).entityEncode(),
    phone: sanitize(rawUser.phone).entityEncode(),
    pictureUrl: rawUser.pictureUrl.removeScheme(),
    website: rawUser.website,
    bio: sanitize(rawUser.bio).entityEncode().truncate(1024, true, '...').htmlize(),
    company: sanitize(rawUser.company).entityEncode().truncate(255, true, '...'),
    title: sanitize(rawUser.title).entityEncode().truncate(255, true, '...'),
    twitter: sanitize(rawUser.twitter).entityEncode()
  };
  
  return new User(sanitizedData);
  
};

//
// Get common links.  Todo: parse a common 'routes' class shared with other classes
//
exports.links = function() {
  return {
    home: '/',
    features: '/features',
    developers: '/developers',
    contact: '/contactus',
    login: '/login',
    facebook: 'http://facebook.com/socialtagg',
    twitter: 'http://twitter.com/socialtagg',
    linkedin: 'http://linkedin.com/company/2693505',
    about: '/about'
  }
};

//
// Process an image url, doing stuff like adding parameter for getting a large
// image from facebook
//
exports.processImageUrlForLargerSize = function(url) {
  
  var result = url;
  if (result) {
    if (result.match(/facebook.com/i)) {
      var delim = '?';
      if (result.match(/\?/)) {
        delim = '&';
      }
      result = result + delim + 'type=large';
    }
  }
  return result;
};
