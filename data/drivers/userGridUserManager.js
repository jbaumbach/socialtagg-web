/*

 Implementation of the user manager functions using Usergrid API.
 
 Docs here:

  https://github.com/apigee/usergrid-node-module
 
 */

var util = require('util')
  , client = require('./../connectors/userGrid')
  , User = require('../../models/User.js')
  , thisModule = this
  ;

//
// Maps a User Grid user to our app's user
//
function UserFromUserGridUser(userGridUser) {
  
  // todo: really understand UG responses.  There's FB stuff in there.
  
  var name = userGridUser.get('name') ||
    util.format("%s %s", userGridUser.get('first_name'), userGridUser.get('last_name'));
  
  var dateStr = 'n/a';
  if (userGridUser.get('created')) {
    dateStr = new Date(userGridUser.get('created')).toDateString();  
  } 
  
  return new User({
    id: userGridUser.get('uuid'),
    userName: userGridUser.get('username'),
    name: name,
    address: userGridUser.get('postal_address'),
    email: userGridUser.get('email'),
    phone: userGridUser.get('tel'),
    pictureUrl: userGridUser.get('picture'),
    createDate: userGridUser.get('created'),
    createDateStr: dateStr,
    website: userGridUser.get('website'),
    bio: userGridUser.get('bio'),
    company: userGridUser.get('company'),
    title: userGridUser.get('title'),
    twitter: userGridUser.get('twitter'),
    website: userGridUser.get('website')
    
  });
}

//
// Maps a User Grid user to our app's user
//
function UserGridUserFromUser(user) {
  // create a "data" object that can be set into the entity object with entity.set(data);
  
  throw('Not implemented');
  
}


//
// Return a user object from the data store corresponding to the passed options
//
function getUsergridUserFromOptions(options, resultCallback) {
  var result = undefined;

  client().getEntity(options, function (err, existingUser) {
    if (err) {
      // Crap
      
    } else {
      result = UserFromUserGridUser(existingUser);
    }

    resultCallback(result);

  });
}

exports.getUser = function(id, resultCallback) {

  var options = {
    type:'users',
    uuid:id
  };

  getUsergridUserFromOptions(options, resultCallback);
};

exports.getUserByUsername = function(username, resultCallback) {
  
  var options = {
    type:'users',
    username:username    // weird: username IS email?
  };

  getUsergridUserFromOptions(options, resultCallback);
};

//
// Upsert the passed user in the data store.  If the user object doesn't have an
// id, then it'll insert.
//
exports.upsertUser = function(user, resultCallback) {
  var result = undefined;

  throw('Not implemented!');

  // eventually: resultCallback(result);

};

//
// Validate the passed credentials and return the user if successful.
//
// Note: as of this writing the email is used in Usergrid as the username,
// so don't be confused by the code below.
//
exports.validateCredentials = function(email, password, resultCallback) {

  var result = undefined;

  thisModule.getUserByUsername(email, function(user) {
    
    if (user) {
      client().login(email, password, function(err) {
        
        if (err) {
          // Crap
        } else {
          result = user;
        }
        
        resultCallback(result);
        
      });
    } else {
      resultCallback(result);
    }
  });
};

//
// Delete a user
//
exports.deleteUser = function(id, resultCallback) {

  throw('Not implemented!');

  // eventually: resultCallback(err);
};

//
// Get an API user by the passed selector
//
function getApiUserWithSelector(collection, findSelector, resultCallback) {
  var result = undefined;

  throw('Not implemented!');

  // eventually: resultCallback(result);

}

//
// Get an API user by the api key
//
exports.getApiUser = function(apiKey, resultCallback) {

  throw('Not implemented!');

  // maybe:  getApiUserWithSelector(collection, findSelector, resultCallback);

};

//
// Get an API user by a user id.  Returns undefined if not found.
//
exports.getApiUserByUserId = function(userId, resultCallback) {

  throw('Not implemented!');

  // maybe:  getApiUserWithSelector(collection, findSelector, resultCallback);

};

//
// Upsert an api user.
//
exports.upsertApiUser = function(apiUser, resultCallback) {
  var result = undefined;

  throw('Not implemented!');

  // eventually: resultCallback(result);

};

//
// Delete an api user
//
exports.deleteApiUser = function(apiKey, resultCallback) {

  throw('Not implemented!');

  // eventually: resultCallback(err);
};

