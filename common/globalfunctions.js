/*

  Component holding the app's global functions.
  
 */

var util = require('util')
  , thisModule = this
  ;

//
// Return the current session info object.  Note, if the redis server isn't running or
// can't be connected to, this will throw an error.
//
exports.getSessionInfo = function(req) {
  var sessionInfo;
  
  try {
    sessionInfo = req.session.sessionInfo;
  } catch(err) {
    console.log('Error getting session info - be sure redis is running: ' + err);
  }

  if (!sessionInfo) {
    //
    // We don't have one, so return a default session info object
    //
    sessionInfo = {
      userId: undefined
    }
  }

  return sessionInfo;
};

//
// Set the current session info object
//
exports.setSessionInfo = function(req, sessionInfo) {
  try {
    req.session.sessionInfo = sessionInfo;
  } catch(err) {
    throw 'Error setting session info - be sure redis is running: ' + err;    
  }
};

//
// Login a user.  Note: no validation is done.
// To indicate a logged in user, store their user id in a session.  Since sessions
// take up RAM on the server, don't store too much here.  Since we're using Redis,
// sessions can be shared on all the servers in your server farm.
//
exports.loginUser = function(req, userId) {
  var sessionInfo = this.getSessionInfo(req);
  sessionInfo.userId = userId;
  this.setSessionInfo(req, sessionInfo);
};

//
// Log out a user.
//
exports.logoutUser = function(req) {
  this.setSessionInfo(req, null);
};

//
// Hash a password.  Use a salt before hashing to make it harder for a hacker to get 
// your users' passwords with a rainbow attack. That's a bit of extra protection
// in case they get their mitts on your database.
//
// However, if they get your source code AND your database, you're kind of in trouble.
// There are some more techniques you can use to go nuts with the security.  Here's a 
// provocative implementation:
//
//  http://alias.io/2010/01/store-passwords-safely-with-php-and-mysql/
//
// Note that no passwords are actually stored in your DB.  So, you can only implement
// "Reset Password" functionality for your users who forget their password.
//
exports.hashPassword = function(password) {
  var crypto = require('crypto');
  var salt = 'put_your_salt_here';

  var result = crypto.createHash('sha256').update(salt + password).digest('hex');

  return result;
};

exports.sha256Encode = function(stringToEncode) {

  var crypto = require('crypto');
  var result = crypto.createHash('sha256').update(stringToEncode).digest('hex');

  return result;
};

exports.md5Encode = function(stringToEncode) {

  var crypto = require('crypto');
  var result = crypto.createHash('md5').update(stringToEncode).digest('hex');

  return result;
};

exports.generateUniqueCredentials = function(uniqueValue) {

  var result = {};
  var anotherUniqueVal = util.format('%s andsomeothercharacters', uniqueValue);

  result.uid = thisModule.md5Encode(uniqueValue);
  result.password = thisModule.md5Encode(anotherUniqueVal);
  
  return result;
};


//***********************************************
// Class extensions
//***********************************************

//
// Truncate a string to a number of chars, optionally breaking on a word, and
// appending a value if the string was trimmed.
//
String.prototype.truncate = function(numberOfChars, useWordBoundary, stringToAddIfTruncated) {
  
  var addToEnd = stringToAddIfTruncated || ''; // '&hellip;'
  var tooLong = this.length > numberOfChars;
  var result = tooLong ? this.substr(0, numberOfChars-1) : this;
  result = useWordBoundary && tooLong ? result.substr(0, result.lastIndexOf(' ')) : result;
  return  tooLong ? result + addToEnd : result;
};

//
// Remove the 'http[s]:' portion of a string
//
String.prototype.removeScheme = function() {
  return this.replace(/http[s]*:/, '');
};

//
// Search an array of objects for an object having a specific value in a 
// specific field.
// 
Array.prototype.find = function(field, value) {
  var result = undefined;
  this.some(function(object) {
    if (object[field] === value) {
      result = object;
    }
    return result != undefined;
  });
  return result;
};