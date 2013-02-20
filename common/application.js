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
    // todo: implement uuid in cookie
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

exports.getSanitizedUser = function(rawUser) {
  var sanitizedData = {
    id: rawUser.id,
    userName: sanitize(rawUser.userName).entityEncode(),
    name: sanitize(rawUser.name).entityEncode().truncate(255, true, '...'),
    address: sanitize(rawUser.address).entityEncode().truncate(255, true, '...'),
    email: sanitize(rawUser.email).entityEncode(),
    phone: sanitize(rawUser.phone).entityEncode(),
    pictureUrl: rawUser.pictureUrl.removeScheme(),
    website: rawUser.website,
    bio: sanitize(rawUser.bio).entityEncode().truncate(255, true, '...'),
    company: sanitize(rawUser.company).entityEncode().truncate(255, true, '...'),
    title: sanitize(rawUser.title).entityEncode().truncate(255, true, '...'),
    twitter: sanitize(rawUser.twitter).entityEncode()
  };
  
  return new User(sanitizedData);
  
};