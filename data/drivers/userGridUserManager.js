/*

 Implementation of the user manager functions using Usergrid API.
 
 Docs here:

  https://github.com/apigee/usergrid-node-module
 
 */

var util = require('util')
  , client = require('./../connectors/userGrid')
  , User = require('../../models/User.js')
  , globalFunctions = require('../../common/globalfunctions')
  , thisModule = this
  ;



//********************************************************************************
// User functions
//********************************************************************************

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
    website: userGridUser.get('url')
    
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

exports.getUserContaggs = function(id, resultCallback) {
  var result = undefined;

  var options = {
    type: 'contaggs',
    qs: { 
      ql: util.format('select * where uuid_user = %s order by created DESC', id),
      limit: '100'
    }
  };
  
  client().createCollection(options, function (err, resultContacts) {
    if (err) {
      // Crap

    } else {
      result = [];
      
      while (resultContacts.hasNextEntity()) {
        
        var contagg = resultContacts.getNextEntity();
        var contaggId = contagg.get('uuid_contagg'); 
        
        //
        // It seems like it's possible there can be duplicate contaggs in
        // usergrid.  Let's enforce uniqueness.
        //
        if (!result.find('uuid', contaggId)) {
          var resultItem = {
            uuid: contaggId,
            created: contagg.get('created')
          };
          
          result.push(resultItem);
        }
      }
    }

    resultCallback(result);

  });
};

exports.populateUserContaggs = function(userContaggIdList, resultCallback) {
  var resultUsers = undefined;
  var currentResultCount = 0;
  var expectedResultCount = userContaggIdList.length;
  
  //
  // Join the results of the usergrid callbacks.  Node.js is single-threaded,
  // so no worries about making code thread safe.
  //
  // http://stackoverflow.com/questions/4631774/coordinating-parallel-execution-in-node-js
  //
  function processResult(resultUser) {
    resultUsers = resultUsers || [];
    currentResultCount++;

    console.log(util.format('(%d) found: ', currentResultCount, resultUser ? resultUser.name : 'undefined'));

    if (resultUser) {
      resultUsers.push(resultUser);
    }

    //
    // If all the results are in, let's get outta here
    //
    // todo: figure out how to timeout this call if one or more usergrid callsbacks doesn't call back
    //
    if (currentResultCount == expectedResultCount) {
      resultCallback(resultUsers);
    }
  }
  
  //
  // Fire off API requests to usergrid in parallel.  Should be faster than calling
  // the API one user at a time.
  //
  userContaggIdList.forEach(function(contagg) {
    thisModule.getUser(contagg.uuid, processResult);
  });
}

exports.addUserContagg = function(user, userIdToAdd, resultCallback) {

  var result = undefined;
  
  var options = {
    type: 'contaggs',
    //
    // We have to put a unique id for the name.  The
    // usergrid component needs it to retrieve the properties after the 
    // entity is created.  It's like a primary key I think.
    //
    name: globalFunctions.md5Encode(user.id + userIdToAdd), 
    
    uuid_user: user.id,
    uuid_contagg: userIdToAdd,
    getOnExist: true    // Don't throw error if exists
  };

  client().createEntity(options, function (err, newContagg) {
    if (err) {
      // Crap

    } else {
      result = newContagg;
    }

    resultCallback(result);

  });
  
  
};




//********************************************************************************
// API user functions
//********************************************************************************

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

