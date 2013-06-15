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
  , globalfunctions = require('./globalfunctions')
  , check = require('validator').check
  , sanitize = require('validator').sanitize
  , CSV = require('csv-string')
  , thisModule = this
  ;


//
// Global variables accessible throughout the application.
// Some are set in app.js, like so:
//
// application.globalVariables.serverPhysicalPath = [path];
//
exports.globalVariables = {
};


//
// Grabs the current user from the session or returns an empty object to the callback.
//
exports.getCurrentSessionUser = function(req, callback) {
  var sessionInfo = globalfunctions.getSessionInfo(req);

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
// Grabs the the user id of the current logged in user
//
exports.getCurrentSessionUserId = function(req) {
  var result;

  var loginStatus = thisModule.loginStatus(req);
  
  if (loginStatus == 2) {
    var sessionInfo = globalfunctions.getSessionInfo(req);
    result = sessionInfo.userId;
  }
  
  return result;
}

//
// Get login status.  Results are as follows:
//
// 0: anonymous user
// 1: cookied user, but not logged in
// 2: logged in user
//
exports.loginStatus = function(req) {
  var sessionInfo = globalfunctions.getSessionInfo(req);
  
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
    home: thisModule.globalVariables.applicationHomepage,
    features: '/features',
    developers: '/developers',
    contact: '/contactus',
    logout: '/logout',
    facebook: '//www.facebook.com/socialtagg',
    twitter: '//www.twitter.com/socialtagg',
    linkedin: '//www.linkedin.com/company/2693505',
    about: '/about',
    tos: '/termsofservice',
    mycontaggs: '/mycontaggs'
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

//
// Call this function to init the global application's pageVars. It
// sets a 'lite' .user and .isLoggedIn properties based on the current
// session info.  Pass an optional callback in order to populate the
// user object as well.
//
exports.buildApplicationPagevars = function(req, pageVars, getUserAndCallback) {

  if (!pageVars) {
    pageVars = {};
  }

  //
  // THe "public" pageVars go out to the client, do NOT put anything you don't want
  // the client to see/hack here.
  //
  pageVars.public = {};
  pageVars.public.user = {};
  pageVars.isLoggedIn = false;
  
  //
  // These are required for the login module so it can post the user info securely
  // in production but not bother in dev
  //
  pageVars.public.serverPath = this.globalVariables.serverPath;
  pageVars.public.secureProtocol = this.globalVariables.secureProtocol;
  pageVars.public.loginDest = pageVars.loginDest;
  
  console.log('loginDest: ' + pageVars.public.loginDest);
  
  pageVars.links = this.links();
  
  //
  // Temporary items - dark release support
  //
  // ex: http://localhost:3000/?loginlink=1 
  
  pageVars.loginLink = req.query.loginlink;
  
  function done() {
    // Encode our public objects, to be readable by the client (Angular)
    pageVars.publicPageVars = JSON.stringify(pageVars.public);

    if (getUserAndCallback) {
      getUserAndCallback(pageVars);

    } else {
      return pageVars;
    }
  }

  var sessionInfo = globalfunctions.getSessionInfo(req);

  if (sessionInfo.userId) {

    pageVars.isLoggedIn = pageVars.public.isLoggedIn = true;

    //
    // Create a 'lite' version of the user object for the page
    //
    pageVars.public.user.id = sessionInfo.userId;

    if (getUserAndCallback) {

      userManager.getUser(sessionInfo.userId, function(user) {

        //
        // Put in the 'full monty' version of the user object
        // todo: remove any insecure info or force the page to SSL
        //
        pageVars.public.user = user;

        done();
      });
    } else {
      done();
    }
  } else {
    done();
  }
}

//
// Return an export file for the passed users
//
//  users: array of user objects
//  format: one of these values: 'csv'
//  callback(err, data): 
//    err: code if something went wrong 
//      1: unsupported 'format' value 
//    data: data corresponding to the requested format
//
// CSV file generation is Outlook friendly based on this format:
//
// http://stackoverflow.com/questions/4847596/what-are-the-csv-headers-in-outlook-contact-export
//
exports.buildUserExportFile = function(users, format, callback) {
  
  if (format.toLowerCase() != 'csv') {
    callback(1);
    return;
  };
    
  //
  // Let's do this little looper thingy so we can always guarantee that our column
  // values will be aligned with the right column header
  //
  var columnsAndRetreivers = [];
  columnsAndRetreivers.push({ header: 'Job Title', retreiver: function(user) { return user.title; }});
  columnsAndRetreivers.push({ header: 'First Name', retreiver: function(user) { return user.firstName; }});
  columnsAndRetreivers.push({ header: 'Last Name', retreiver: function(user) { return user.lastName; }});
  columnsAndRetreivers.push({ header: 'Company', retreiver: function(user) { return user.company; }});
  columnsAndRetreivers.push({ header: 'E-mail Address', retreiver: function(user) { return user.email; } });
  columnsAndRetreivers.push({ header: 'Mobile Phone', retreiver: function(user) {return user.phone; } });
  columnsAndRetreivers.push({ header: 'Web Page', retreiver: function(user) { return user.website; } });
  columnsAndRetreivers.push({ header: 'Business Street', retreiver: function(user) { return user.address; } });

  //
  // Build our header row
  //
  var headerArray = [];
  columnsAndRetreivers.forEach(function(cr) {
    headerArray.push(cr.header);
  });

  if (columnsAndRetreivers.length != headerArray.length) {
    console.log('Crap, headers not enough fields');  
  }
  
  // Note: CSV.stringify() automatically adds the \r\n at the end
  var resultData = CSV.stringify(headerArray);

  //
  // Build our value row
  //
  users.forEach(function(user) {

    var userValueArray = [];
    columnsAndRetreivers.forEach(function(cr) {
      userValueArray.push(cr.retreiver(user));
    });

    var columnRow = CSV.stringify(userValueArray);
    
    resultData += columnRow;
  });
  
  //
  // If we're here, we're happy
  //
  callback(null, resultData);
  
};
