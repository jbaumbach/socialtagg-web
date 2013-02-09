/*

 Implementation of the user manager functions using MongoDb.

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
  
  return new User({
    id: userGridUser.get('uuid'),
    name: name,
    address: userGridUser.get('postal_address'),
    email: userGridUser.get('email'),
    phone: userGridUser.get('tel'),
    pictureUrl: userGridUser.get('picture'),
    createDate: userGridUser.get('created'),
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
// Return a user object from the data store corresponding to the passed id
//
exports.getUser = function(id, resultCallback) {
  var result = undefined;

  var options = {
    type:'users',
    uuid:id
  }
  
  client().getEntity(options, function(err, existingUser) {
    if (err) {
      // Crap
    } else {
      result = UserFromUserGridUser(existingUser);
    }

    resultCallback(result);

  });
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
// Validate the passed credentials and return the user if successful
//
exports.validateCredentials = function(email, password, resultCallback) {

  throw('Not implemented!');

  // eventually: resultCallback(user);

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

