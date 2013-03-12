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
  , thisModule = this
;

//********************************************************************************
// User functions
//********************************************************************************

exports.getUser = function(id, resultCallback) {
  db.getUser(id, resultCallback);
};

exports.getUserByUsername = function(email, resultCallback) {
  db.getUserByUsername(email, resultCallback);
};

exports.getUserByEmail = function(emailAddr, resultCallback) {
  db.getUserByEmail(emailAddr, resultCallback);
}

exports.upsertUser = function(user, resultCallback) {
  db.upsertUser(user, resultCallback);
};

exports.validateCredentials = function(email, password, resultCallback) {
  db.validateCredentials(email, password, resultCallback);
};

exports.deleteUser = function(id, resultCallback) {
  db.deleteUser(id, resultCallback);
};

exports.getUserContaggs = function(id, resultCallback) {
  db.getUserContaggs(id, resultCallback);
};

exports.populateUserContaggs = function(userContaggIdList, resultCallback) {
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