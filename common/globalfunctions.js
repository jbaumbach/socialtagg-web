/*

  Component holding the app's global functions.
  
 */

var util = require('util')
  , path = require('path')
  , http = require('http')
  , https = require('https')
  , thisModule = this
  ;

//
// Return the current session info object.  Note, if the redis server isn't running or
// can't be connected to, this will throw an error.
//
exports.getSessionInfo = function(req) {
  var sessionInfo;
  
  // Help find stupid programmer errors faster
  if (!req) {
    throw '(error) getSessionInfo: req is null, cannot continue';
  }
  
  try {
    sessionInfo = req.session.sessionInfo;
  } catch(err) {
    console.log('(error) can\'t get session info - be sure redis is running: ' + err);
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

//
// Splits a name and returns an object with firstName and lastName properties, or undefined if error.
//
exports.splitNames = function(fullName) {
  var result = undefined;
  var nameArray = fullName.split(' ');

  if (nameArray && nameArray.length >= 2) {
    result = { firstName: nameArray[0].trim(), lastName: nameArray[nameArray.length - 1].trim() };
  }
 
  return result;
}

/**
 * Convert a possibly null date to a date string, using the default if otherwise.
 * @param inputDate
 * @param defaultIfNull
 */
exports.convertDate = function(inputDate, defaultIfNull) {
  
  var result = defaultIfNull;
  if (inputDate) {
    result = new Date(inputDate).toDateString();
  }
  
  return result;
};

//
// Returns the filename without extenstion for the .js file at the passed path
// example:
//   '/my/path/to/file.js'  => 'file'
//
exports.filenameNoExtension = function(pathAndName) {
  var fileName = path.basename(pathAndName, '.js');
  return fileName;
}

/*
  Return the scheme of the passed url, or empty if nothing found.
 */
exports.getUrlScheme = function(url) {

  var result;
  var scheme = url.match(/(^http[s]*):/i);

  if (scheme && scheme.length == 2) {
    result = scheme[1];
  }
  
  return result;
}

/*
  Convenience function to get the document at the specified url.
  Parameters:
    url: the url to grab
    resultCallback: a function with this signature:
      err: filled in if an error
      result: object with these values:
        response: the response object from here: http://nodejs.org/api/http.html#http_http_request_options_callback 
                  (e.g. response.statusCode gets the status code, response.headers gets the headers, etc)
        body: the body of the response
 */
exports.getDocumentAtUrl = function (url, resultCallback) {

  var scheme = thisModule.getUrlScheme(url);
  var result = {};
  
  var documentRetreiver = (scheme === 'https' ? https : http);
  
  // 
  // Grab the doc using either http or https
  //
  documentRetreiver.get(url,function (res) {

    result.response = res;
    result.body = '';

    // console.log("(info) Got response: " + res.statusCode);

    res.on('data',function (chunk) {
      //console.log('got some data...');

      result.body += chunk;

    }).on('end', function () {

      resultCallback(null, result);
        
    });

  }).on('error', function (e) {
      //console.log("(error) validateFacebookLogin: Got error: " + e.message);

      resultCallback(e.message, null);

    });
};

/*
  Generate a Twitter hashtag from the passed string
  Parameters:
    origString: a string (or number) with spaces and other non-alphanumeric characters
    
  Returns:
    a string with no spaces, only alphanumeric characters and all lowercase
 */
exports.toHashtag = function(origString) {

  var result = origString;
  
  if (origString) {
    var temp = origString.toString();
    result = temp.replace(/\W/g, '').toLowerCase();
  }
  
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
// Replace some plaintext items with HTML equivalents, such as "\n" -> "<br>"
//
String.prototype.htmlize = function() {
  var result = this.replace(/\n/g, '<br>');
  return result;
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