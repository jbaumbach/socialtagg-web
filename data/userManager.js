/*

  The user manager functions.  
  
  The purpose of this class is to decouple your business
  logic from database logic.  This is beneficial because your future developers
  don't have to know or care what database is being used, and if you want to change
  databases in the future, you won't have to refactor your business logic.

  Currently there is no application caching - we're going direct to the db each time
  for our data.  Eventually this could limit the scalability of your site.  
  
  This would be a good place to implement our application caching.
  
 */

//
// todo: use a factory pattern to allow dependency injection.  We just hard
// code the manager now.
//  
var
  // db = require('./drivers/mongoUserManager')
  db = require('./drivers/userGridUserManager')
  , globalFunctions = require('../common/globalfunctions')
  , cache = require('../common/cache')
  , User = require('../models/User')
  , thisModule = this
;

//********************************************************************************
// User functions
//********************************************************************************

/*
 Get a user from UG for the passed id
 Parameters:
   id: the usergrid user id, aka uuid
   resultCallback: a function with signature:
     user: the retreived user, or undefined if not found (or error)
 */
exports.getUser = function(id, resultCallback) {
  
  var cacheKey = User.cacheKey(id);
  
  cache.getFromCache(cacheKey, function(user) {
    if (user) {
      
      resultCallback(user);
      
    } else {

      db.getUser(id, function(dbUser) {
        
        cache.addObjectToCache(dbUser, function() {
          resultCallback(dbUser);
          
        });
      });
    }
  })
  
};

exports.getUserByUsername = function(email, resultCallback) {
  db.getUserByUsername(email, resultCallback);
};

/*
  Get a user by email address.  
  Parameters:
  emailAddr: the email address
  resultCallback: a callback with the signature:
    user: the user with that email, or undefined
*/
exports.getUserByEmail = function(emailAddr, resultCallback) {
  db.getUserByEmail(emailAddr, resultCallback);
}

/*
 Upsert the passed user in the data store.
 Parameters:
   user: the user object to upsert in the database
   resultCallback: a function with signature:
     err: filled in if something bad happened
     user: the new or updated user object
 */
exports.upsertUser = function(user, resultCallback) {
  
  db.upsertUser(user, function(err, user) {
    cache.addObjectToCache(user, function() {

      resultCallback(err, user);
    })
  });
};

/* 
  Delete a user from the DB.  Generally just for testing!
  Parameters:
    userId: the user to delete
    resultCallback: a function with signature:
      err: filled in if something bad happened
 */
exports.deleteUser = function(userId, resultCallback) {
  db.deleteUser(userId, resultCallback);
};

/*
  Inserts a user registration record.
  Parameters:
    userReg: object with email, password, and reg validation code fields
    resultCallback: function with signature:
      err: filled in if there's an error
      user: the user reg info
 */
exports.upsertUserRegistration = function(userReg, resultCallback) {
  db.upsertUserRegistration(userReg, resultCallback);
}

exports.validateCredentials = function(email, password, resultCallback) {
  
  db.validateCredentials(email, password, function(user) {
    if (user) {
       cache.addObjectToCache(user, function() {
         resultCallback(user);
       })
    } else {
      resultCallback(user);
    }
  });
  
};

/*
  Looks up the passed Facebook access token and grabs the user from the db
  Parameters:
    accessToken: the access token returned from Facebook when user logged into the OAuth thingy
    resultCallback: a callback function with this signature:
      err: populated if something bad happened
      user: the user object if we have one
 */
exports.validateFacebookLogin = function(accessToken, resultCallback) {
  db.validateFacebookLogin(accessToken, function(err, user) {
    
    if (err) {
      
      resultCallback(err);
      
    } else {

      cache.addObjectToCache(user, function() {
        resultCallback(null, user);
      });
      
    }
  });
}

/*
 Get a user validation record from UG.  Similar to 'getUGRegistrationByEmail', but
 returns JSON object rather than a usergrid object.
 Parameters:
   email: the email address to look up
   resultCallback: callback with signature:
     err: filled in if something bad happened
     userReg: a user registration JSON object, or undefined 
 */
exports.getRegistrationInfoByEmail = function(email, resultCallback) {
  db.getRegistrationInfoByEmail(email, resultCallback);
};

exports.deleteUser = function(id, resultCallback) {
  db.deleteUser(id, resultCallback);
};

exports.getUserContaggs = function(id, resultCallback) {
  db.getUserContaggs(id, resultCallback);
};

exports.populateUserContaggs = function(userContaggIdList, resultCallback) {
  //
  // todo: add caching here, or the server will get killed by event analytics
  //
  db.populateUserContaggs(userContaggIdList, resultCallback);
};

exports.addUserContagg = function(user, userIdToAdd, resultCallback) {
  db.addUserContagg(user, userIdToAdd, resultCallback);
};

exports.setUserVerificationCodeByEmail = function(code, email, resultCallback) {
  db.setUserVerificationCodeByEmail(code, email, resultCallback)  
};

exports.setUserPasswordWithVerificationCodeByEmail = function(email, originalCode, newPw, resultCallback) {
  db.setUserPasswordWithVerificationCodeByEmail(email, originalCode, newPw, resultCallback);
};

exports.getUserEventsAttended = function(id, resultCallback) {
  db.getUserEventsAttended(id, resultCallback);
}

exports.getUserEventsOwned = function(id, resultCallback) {
  db.getUserEventsOwned(id, resultCallback);
}

/**
 * Checks in a user to an event
 * @param userId - the user id
 * @param eventId - the event id
 * @param resultCallback - callback with parameters:
 *  err - filled in if something bad happened
 */
exports.checkinUserToEvent = function(userId, eventId, resultCallback) {
  db.checkinUserToEvent(userId, eventId, resultCallback);
}

/**
 * Registers a user for an event
 * @param userId - the user id
 * @param eventId - the event id
 * @param resultCallback - callback with parameters:
 *  err - filled in if something bad happened
 */
exports.registerUserToEvent = function(userId, eventId, resultCallback) {
  db.registerUserToEvent(userId, eventId, resultCallback);
}

/**
 * For each of the passed eventUser objects, add an 'Event' property
 * @param {array} array of eventUser objects
 * @param {function} resultCallback, with parameters:
 *  err {object} filled in if something bad happened
 */
exports.populateEvents = function(eventUserList, resultCallback) {
  db.populateEvents(eventUserList, resultCallback);
}

exports.getUserContaggsFromEvent = function(userId, eventId, resultCallback) {
  db.getUserContaggsFromEvent(userId, eventId, resultCallback);
}

/*
 Sets a user profile picture.

 Parameters:
   options: an object holding the upload info.  The fields are:
     userId: the user id to set the picture for
     data: the picture data
     fileName: the image name
     mime: the mime type
    
   resultCallback: callback function with signature:
     err: filled in if something went wrong
     --
 */
exports.setUserProfilePicture = function(options, resultCallback) {
  db.setUserProfilePicture(options, resultCallback);
}

exports.getEventUsers = function(eventId, type, callback) {
  db.getEventUsers(eventId, type, callback);
}

exports.getUserCounts = function(options, callback) {
  db.getUserCounts(options, callback);
}

//********************************************************************************
// API user functions
//********************************************************************************

exports.getApiUser = function(apiKey, resultCallback) {
  db.getApiUser(apiKey, resultCallback);
}

exports.getApiUserByUserId = function(userId, resultCallback) {
  db.getApiUserByUserId(userId, resultCallback);
}

//
// Insert or update an api user.  Note that if inserting an api user (e.g. the apiKey
// field is empty), the apiKey and password fields will be generated and filled in
// to the returned ApiUser object.
//
exports.upsertApiUser = function(apiUser, resultCallback) {
  
  var currentApiKey = apiUser.apiKey || '';
  var isInserting = currentApiKey === '';

  db.upsertApiUser(apiUser, function(newApiUser) {
    
    if (isInserting) {
      //
      // We have more work to do - let's generate some values based off the new id
      // we got from the DB that's guaranteed to be unique.  MD5 is good enough to
      // use to generate unique 32 character values, plus it would make it harder
      // on an attacker to guess sequential UIDs
      //
      var uniqueVal = newApiUser.id;
      var uniqueKeys = globalFunctions.generateUniqueCredentials(uniqueVal);

      newApiUser.apiKey = uniqueKeys.uid;
      newApiUser.password = uniqueKeys.password;
      
      thisModule.upsertApiUser(newApiUser, resultCallback);

    } else {
      resultCallback(newApiUser);
    }    
  })
}

exports.deleteApiUser = function(apiKey, resultCallback) {
  db.deleteApiUser(apiKey, resultCallback);
}