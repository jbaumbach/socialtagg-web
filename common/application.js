
var util = require('util')
  , userManager = require('../data/userManager')
  , globalFunctions = require('./globalfunctions')
  , check = require('validator').check
  , sanitize = require('validator').sanitize
  , CSV = require('csv-string')
  , moment = require('moment')
  , sprintf = require("sprintf-js").sprintf
  , Validator = require('validator').Validator
  , _ = require('underscore')
  , thisModule = this
  , User = require(process.cwd() + '/models/User')
  , async = require('async')
  ;

//*** Note: do not reference any /models directly from this class.  Models include this
//*** module, causing a circular reference that doesn't always get caught by the unit tests!

//
// Global variables accessible throughout the application.
// Some are set in app.js, like so:
//
// globalVariables.serverPhysicalPath = [path];
//


/*
  Grabs the current user from the session or returns an empty object to the callback.
  
  Parameters:
    req: the current request. Required to access session info.
    callback: a callback function with the signature:
      user: the user retrieved, or null if something went wrong
*/
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
// Grabs the the user id of the current logged in user
//
exports.getCurrentSessionUserId = function(req) {
  var result;

  var loginStatus = thisModule.loginStatus(req);
  
  if (loginStatus == 2) {
    var sessionInfo = globalFunctions.getSessionInfo(req);
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

/*
See note in testApplication/should return a sanitized user from bad values for why this is removed.
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
*/

//
// Get common links.  Todo: parse a common 'routes' class shared with other classes
//
// Remember: this is a function, so be sure to get the links like: "application.links().editprofile"
//
exports.links = function(options) {
  return {
    home: globalVariables.applicationHomepage,
    features: '/features',
    pricing: '/pricing',
    developers: '/developers',
    contact: '/contactus',
    login: globalVariables.secureProtocol + '://' + globalVariables.serverPath + '/login' + 
      ((options && options.logindest) ? '?logindest=' + options.logindest : ''),
    logout: '/logout',
    facebook: '//www.facebook.com/socialtagg',
    twitter: '//www.twitter.com/socialtagg',
    linkedin: '//www.linkedin.com/company/2693505',
    about: '/about',
    tos: '/termsofservice',
    mycontaggs: '/mycontaggs',
    appiphone: 'http://itunes.apple.com/app/id649747318',
    appandroid: 'https://play.google.com/store/apps/details?id=com.socialtagg&feature=search_result#?t=W251bGwsMSwyLDEsImNvbS5zb2NpYWx0YWdnIl0',
    appwindows: 'http://www.windowsphone.com/en-us/store/app/socialtagg/047af900-02d7-4e3d-b77b-89de81c589c1',
    myattendedevents: '/myattendedevents',
    myownedevents: '/myownedevents',
    editprofile: '/editprofile',
    viewprofile: '/viewprofile',
    forgotpassword: '/users/:id/forgotpassword'
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
// Access the user's info in Jade like so:
//
//    img(src=public.user.pictureUrl).user-image
// 
exports.buildApplicationPagevars = function(req, pageVars, getUserAndCallback) {

  if (!pageVars) {
    pageVars = {};
  }

  //
  // THe "public" pageVars go out to the client, do NOT put anything you don't want
  // the client to see/hack here.
  //
  // Generally these are for initing Angular controllers.  If you add your own, be sure
  // to stringify them.
  //
  // These variables are JSON.stringify'd and you can access them in Jade by 'publicPageVars'.
  //
  pageVars.public = pageVars.public || {};
  pageVars.public.user = pageVars.public.user || {};
  pageVars.isLoggedIn = false;
  
  //
  // These are required for the login module so it can post the user info securely
  // in production but not bother in dev
  //
  pageVars.public.serverPath = globalVariables.serverPath;
  pageVars.public.secureProtocol = globalVariables.secureProtocol;
  
  //
  // Misc variables that are good for Jade to know about
  //
  pageVars.public.sentryDsn = globalVariables.sentryDsn;
  
  //
  // loginDest tells the login page where to go after login.  It can be set in a few ways:
  //
  //  1. Automatically - the logindest is appended to the .login link if you call it from Jade
  //      provided this function is called.
  //
  //  2. Explicitly - set { logindest: [url] } in an object passed to application.links(), and
  //      then grab your url to the login page.  You don't need to call this function.
  //
  
  //
  // 2013-09-15 JB: land on mycontaggs page by default after login, unless we clicked a page that requires
  // a login.  In that case, go to the page the user wants to go to.
  //
  var ld = req.query.logindest || req.query.loginDest || thisModule.links().mycontaggs;   // was: req.url;
  
  if (ld.match(/login/i)) {
    console.log('(warning) loginDest: found word "login" in url, probaby not right.  Make sure all links to the login ' +
      'page have ?logindest=[page] on them.');
    ld = '/';
  }
  
  pageVars.public.loginDest = ld;
    
  pageVars.links = this.links({ logindest: ld});
  
  //
  // Temporary items - dark release support
  //
  // ex: http://localhost:3000/?loginlink=1 
  
  //
  // Dark features
  // specified in app.js for 'development' and possibly 'staging'
  //
  // Use these in Jade like:   if locals.showsocial ...
  //
  pageVars.showpricing = globalVariables.showpricing || req.query.showpricing;
  pageVars.enablelinkedin = globalVariables.enablelinkedin || req.query.enablelinkedin;
  

  function done() {
    // Encode our public objects, to be readable by the client (Angular)
    pageVars.publicPageVars = JSON.stringify(pageVars.public);

    if (getUserAndCallback) {
      getUserAndCallback(pageVars);

    } else {
      return pageVars;
    }
  }

  var sessionInfo = globalFunctions.getSessionInfo(req);

  if (sessionInfo.userId) {

    pageVars.isLoggedIn = pageVars.public.isLoggedIn = true;

    //
    // Create a 'lite' version of the user object for the page
    //
    pageVars.public.user.id = sessionInfo.userId;
    pageVars.sentryUserInfo = { id: sessionInfo.userId };
    
    if (getUserAndCallback) {

      userManager.getUser(sessionInfo.userId, function(user) {

        //
        // Put in the 'full monty' version of the user object
        // todo: remove any insecure info or force the page to SSL
        //
        pageVars.public.user = user;
        pageVars.sentryUserInfo.email = user.email;

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

function hasMomentBug() {
  //
  // Note: after upgrade to new version of Node, this sample code from
  // the Moment documentation doesn't work:
  //
  // http://momentjs.com/docs/#/parsing/utc/
  //
  var a = moment.utc([2011, 0, 1, 8]);
  // here, a.hours() would be: // 8 UTC
  a.local();
  var r = a.hours();  // should be: 0 PST
  
  return (r != 0);
}

/*
  Process a unix date and timezone and return local date and time. 
   
  Parameters:
    dateMs: time in unix format
    timezoneOffset: the timezone offset value
    
  Returns:
    Object with properties:
      date: the date string in M/D/YYYY format
      time: the time string in h:m A format
 */
exports.getContituentDateParts = function(dateMs, timezoneOffset) {

  var result = {};
  
  var d = moment(dateMs);
  
  if (timezoneOffset) {
    d.zone(timezoneOffset.toString());  // Must be a string now for some reason
  }
  
  //
  // Note: after upgrade to new version of Node, this line no longer
  // works:
  //
  // d.local();

  //
  // Horrible ugly hack to just get this stupid code working again.  Somehow 'moment'
  // broke on my computer and there's no good reason why.  Thank god I had unit
  // tests that identified the issue before it got released.
  //
  d.add('hours', timezoneOffset.toString());

  //
  // DST is one hour ahead of our tzoffset, let's correct for it since we're displaying
  // in non-DST
  //
  if (d.isDST()) {
    d.subtract('hours', 1);
  }
  
  result.date = d.format('M/D/YYYY');
  result.time = d.format('h:mm A');

  return result;
};

/*
  Take the passed date, time, and tz strings and convert to a Javascript epoch date number
  Parameters:
    dateStr: a date, formatted as 'm/d/yyyy'
    timeStr: a time, formatted as 'h:mm AM'
    tzOffset: a timezone offset, in standard time (not daylight time!)
    
  Returns:
    The epoch date number (a big int) or undefined if the strings aren't parseable
 */
exports.getDatetimeFromStringParts = function(dateStr, timeStr, tzOffset) {

  var result;
  
  //
  // Check for validity of the date and time without timezone first.  Appending the timezone
  // always makes it valid even if the strings are not.
  //
  var isValid = moment(dateStr + ' ' + timeStr).isValid();
  
  if (isValid) {

    var dateTimeStr = dateStr + ' ' + timeStr + sprintf(' GMT%+02d00', parseInt(tzOffset));

    result = moment(dateTimeStr).valueOf();
    
    //
    // Submitted time is one hour behind our tzoffset when we're in DST.  
    // However, moment is smart enough to correct for this.  No need to manually
    // correct.
    
  } 
  
  return result;
}

//
// Create a validator that collects errors
//
exports.ErrorCollectingValidator = function () {

  //
  // Set up the validator so it will collect errors rather than 
  // throw exceptions.
  //
  Validator.prototype.error = function (msg) {
    this._errors.push(msg);
    return this;
  }

  Validator.prototype.getErrors = function () {
    return this._errors;
  }

  return new Validator();

}

exports.registrationValidationUrl = function(email, verificationCode) {
  
  var result = util.format('%s://%s/registration/verify?email=%s&code=%s',
    globalVariables.secureProtocol,
    globalVariables.serverPath,
    encodeURIComponent(email),
    verificationCode
  );
  
  return result;
}

/**
 * This accepts a list of "lite" dataItems and builds a summary dataset
 * based on day, week, or month.
 *
 * Each "lite" object is required to have  '.created' property.  It should not have
 * a "dayOfYear", "week", or "month" property.
 * @type {Function}
 */
exports.getDataSummary = function(options, dataItems) {

  if (!dataItems) {
    console.log('(warning) no dataItems passed!');
  }

  if (options && options.filterFunction) {
    //
    // Call a filter function if we have one
    //
    dataItems = options.filterFunction(dataItems);
  }

  //
  // Convert an event into something we can count (e.g. the week number)
  //
  var mapper = function(dataItem) {
    var m = moment(+dataItem.created);
    dataItem.dayOfYear = m.dayOfYear();
    dataItem.week = m.week();
    dataItem.month = m.month();
    
    return dataItem;
  }

  //
  // Aggregate the mapped dataItems (only counting by weeks is currently supported)
  //
  var reducer = function(memo, dataItem) {
    var week = memo[dataItem.week];
    //
    // Only include the data item if it's within our range, as defined by the memo
    // object.
    //
    if (week) {
      week.count = ++week.count;
    }

    return memo;
  }

  //
  // Build empty result set
  //
  var memo = {};

  if (options && options.dateRange && options.dateRange.weeks) {

    var dateCounter = moment().subtract('weeks', (options.dateRange.weeks - 1));
    var now = moment();
    var sanity = 10000;      // Max number of stuff to count, not sure if this is required yet

    while (dateCounter <= now) {
      var weekNumber = dateCounter.week();
      memo[weekNumber] = {
        week: weekNumber,
        year: dateCounter.year(),
        desc:'Week of ' + dateCounter.format('dddd, MMMM Do YYYY'),
        count: 0
      }

      dateCounter = dateCounter.add('weeks', 1);
      if (--sanity < 0) throw 'stupid infinite loop';
    }
  } else {
    throw 'Sorry, only options.dateRange.weeks is currently supported!';
  }

  var summary = _.
    chain(dataItems).
    map(mapper).
    reduce(reducer, memo).
    value();

  return summary;
}

/****************************************************************************

 Functions that could probably go into models if we were so inclined
 
 *****************************************************************************/

exports.findOrCreateFromProvider = function(passportResponse, callback) {

  var accountPassword;
  var email;

  async.waterfall([
    function validateProvider(cb) {
      //
      // As of this writing, only linkedin is supported
      //
      if (passportResponse.provider !== 'linkedin') {
        cb({ err: 'provider ' + passportResponse.provider + ' is not supported!' });
      } else {
        //
        // The same method is used in the other clients - hashing linkedin id with ST's linkedin secret key
        //
        accountPassword = globalFunctions.sha256Encode(passportResponse.id + '_5eDrU2RuprUp2Cub');
        
        //
        // As of this writing, we're using email address as the primary key.  
        //
        email = (passportResponse.emails && passportResponse.emails.length > 0) ? passportResponse.emails[0].value : null;        cb();
      }
    },
    function findEmailInPassportResponse(cb) {
      if (email) {
        cb();
      } else {
        cb({ msg: 'no email address supplied '});
      }
    },
    function findUser(cb) {
      userManager.getUserByEmail(email, function(user) {
        cb(null, user);
      });
    },
    function createUserIfNecessary(user, cb) {
      if (!user) {

        //
        // Create user object and store in database
        //
        var newUser = new User({
          userName: email,
          firstName: passportResponse.name.givenName,
          lastName: passportResponse.name.familyName,
          email: email,
          pictureUrl: passportResponse._json.pictureUrl,
          website: passportResponse._json.publicProfileUrl,
          bio: passportResponse._json.headline
        });

        newUser.password = accountPassword; 

        userManager.upsertUser(newUser, function(err, newUser) {
          if (err) {
            cb({ err: err });
          } else {
            cb(null, newUser);
          }
        });

      } else {
        //
        // We have a user, let's see if the id from the provider matches the email.  This 
        // extra step prevents someone from spoofing an account with someone else's email
        //
        userManager.validateCredentials(email, accountPassword, function(validatedUser) {
          if (validatedUser) {
            cb(null, user);
          } else {
            cb({ msg: 'sorry, that email address is already in use by another account '});
          }
        })
      }
    }
  ], callback);

}
