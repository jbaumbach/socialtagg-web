/*

 Implementation of the user manager functions using Usergrid API.
 
 Docs here:

  https://github.com/apigee/usergrid-node-module
 
 */

var util = require('util')
  , client = require('./../connectors/userGrid')
  , User = require('../../models/User.js')
  , ApiUser = require('../../models/ApiUser.js')
  , globalFunctions = require('../../common/globalfunctions')
  , application = require('../../common/application')
  , thisModule = this
  ;



//********************************************************************************
// User functions
//********************************************************************************

//
// Maps a User Grid user to our app's user
//
function userFromUserGridUser(userGridUser) {
  
  // todo: really understand UG responses.  There's FB stuff in there.
  
  var dateStr = 'n/a';
  if (userGridUser.get('created')) {
    dateStr = new Date(userGridUser.get('created')).toDateString();  
  } 
  
  return new User({
    id: userGridUser.get('uuid'),
    userName: userGridUser.get('username'),
    name: userGridUser.get('name'),
    firstName: userGridUser.get('first_name'),
    lastName: userGridUser.get('last_name'),
    address: userGridUser.get('postal_address'),
    email: userGridUser.get('email'),
    phone: userGridUser.get('tel'),
    pictureUrl: application.processImageUrlForLargerSize(userGridUser.get('picture')),
    createDate: userGridUser.get('created'),
    createDateStr: dateStr,
    website: userGridUser.get('website') || userGridUser.get('url'),
    bio: userGridUser.get('bio'),
    company: userGridUser.get('company'),
    title: userGridUser.get('title'),
    twitter: userGridUser.get('twitter'),
    avatarId: userGridUser.get('uuid_avatar_image')
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
function getUserFromUserGridByOptions(options, resultCallback) {
  var result = undefined;

  client().getEntity(options, function (err, existingUser) {
    if (err) {
      // Crap
      
    } else {
      result = userFromUserGridUser(existingUser);
    }

    resultCallback(result);

  });
}

//
// Callback params: err  (0 = no error, 1 = user not found, 2 = db error)
//                  userGridUser (the resulting userGridUser)
//
function getUserGridUserByEmail(email, resultCallback) {
  var options = {
    type: 'users',
    qs: {
      // Note - you must use SINGLE QUOTES around a string value to search for
      ql: util.format('select * where email = \'%s\'', email),
      limit: '100'
    }
  };

  client().createCollection(options, function (err, existingUsers) {
    if (err) {
      // Crap
      resultCallback(2);

    } else {
      if (existingUsers.hasNextEntity()) {

        var existingUser = existingUsers.getNextEntity();
        resultCallback(0, existingUser);
        
      } else {
        resultCallback(1);
      }
    }
  });
  
};

//
// Callback params: err  (true if error)
//
function setUserGridUserPassword(existingUser, newPw, resultCallback) {
  var options = {
    method:'PUT',
    endpoint:'users/' + existingUser.get('username') + '/password',
    body:{ newpassword: newPw }
  };

  client().request(options, function (err, data) {
    resultCallback(err);
  });
};


function getUserContaggsByOptions(options, resultCallback) {
    client().createCollection(options, function (err, resultContacts) {
    if (err) {
      // Crap

    } else {
      var result = [];
      
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

}

//***************** Public functions ********************************

exports.getUser = function(id, resultCallback) {

  var options = {
    type:'users',
    uuid:id
  };

  getUserFromUserGridByOptions(options, resultCallback);
};

exports.getUserByUsername = function(username, resultCallback) {
  
  var options = {
    type:'users',
    username:username    // weird: username IS email?
  };

  getUserFromUserGridByOptions(options, resultCallback);
};

exports.getUserByEmail = function(emailAddr, resultCallback) {
  
  var result = undefined;
  
  getUserGridUserByEmail(emailAddr, function(err, userGridUser) {
    if (err === 0) {
      result = userFromUserGridUser(userGridUser);
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
// Validate the passed credentials and return the user if successful.
//
// Note: as of this writing the email is used in Usergrid as the username,
// so don't be confused by the code below.
//
exports.validateCredentials = function(email, password, resultCallback) {

  var result = undefined;

  thisModule.getUserByUsername(email, function(user) {
    
    if (user) {
      console.log('(info) found user ok');
      client().login(email, password, function(err) {
        
        if (err) {
          // Crap
          console.log('(error) client().login failed, err: ' + err);
        } else {
          result = user;
        }
        
        resultCallback(result);
        
      });
    } else {
      console.log('(info) couldn\'t find user by email: ' + email);
      
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
      // Note - you must use SINGLE QUOTES around a string value to search for
      ql: util.format('select * where uuid_user = %s order by created DESC', id),
      limit: '100'
    }
  };

  getUserContaggsByOptions(options, resultCallback);
  
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

//
// Get the events this user has attended
//
exports.getUserEventsAttended = function(id, resultCallback) {
  var events = [];
  var sampleEvent = {
    event_uuid: 1234,
    checkin_date: Date.parse('2013-07-05 16:45')
  };
  
  events.push(sampleEvent);
  
  resultCallback(events);
};

//
// Gets user contaggs for the specified event
//
// Params:
//    userId - The user to look up
//    eventId - The event's id where the contagg was made
//    resultCallback - the function to call when complete.  The signature is:
//        contaggs - the contaggs objects, or undefined if something went wrong
//
exports.getUserContaggsFromEvent = function(userId, eventId, resultCallback) {
  var result = undefined;

  var options = {
    type: 'contaggs',
    qs: { 
      // Note - you must use SINGLE QUOTES around a string value to search for
      ql: util.format('select * where uuid_user = %s and event_uuid = %s order by created DESC', 
        userId,
        eventId),
      limit: '100'
    }
  };

  getUserContaggsByOptions(options, resultCallback);
  
};

//
// Get the events this user is the owner of.
// Parameters:
//  id: the user id to search for
//  resultCallback: function pointer with this signature:
//    events: fully populated array of event objects.
//
exports.getUserEventsOwned = function(id, resultCallback) {
  thisModule.populateEvents([1234], resultCallback);
}

//
// Grab the complete object from the db for each event in the list. 
// Parameters:
//  eventIdList: array of event ids to lookup
//  resultCallback: function pointer with this signature:
//    events: fully populated array of event objects
//
exports.populateEvents = function(eventIdList, resultCallback) {
  var events = [];
  var sampleEvent = {
    uuid: 1234,
    owner: 5678,
    name: 'SocialTagg\'s Event',
    description: 'Super special event for getting new event planners',
    modified: Date.parse('2013-07-05 16:45'),
    created: Date.parse('2013-07-05 16:45'),
    start_date: Date.parse('2013-07-05 17:45'),
    end_date: Date.parse('2013-07-05 18:45'),
    location_lat: 33.988105,
    location_lon: -118.47056,
    website: 'www.socialtagg.com',
    link: application.getEventDetailUrlForId(1234)
  };
  
  events.push(sampleEvent);
  
  resultCallback(events);
  
};

//
// Callback params: err  (0 = no error, 1 = user not found, 2 = db error)
//                  code (the verification code)
//
exports.setUserVerificationCodeByEmail = function(code, email, resultCallback) {
  
  getUserGridUserByEmail(email, function(err, existingUser) {
    if (err === 0) {
      existingUser.set('forgotPasswordValidationCode', code);

      existingUser.save(function(err) {

        if (err) {
          resultCallback(2);
        } else {
          resultCallback(0, code);
        }
      });

    } else {
      resultCallback(err, code);
    }
  });
};


//
// Callback params: err  (0 = no error, 1 = user not found, 2 = db error, 3 = bad verification code)
//
exports.setUserPasswordWithVerificationCodeByEmail = function(email, originalCode, newPw, resultCallback) {

  getUserGridUserByEmail(email, function(err, existingUser) {
    if (err === 0) {
      var currentDbCode = existingUser.get('forgotPasswordValidationCode');

      if (currentDbCode == originalCode) {

        //
        // Clear existing verification code
        //
        // todo: put this in a separate collection in UG, not the user record in /users
        // 
        // existingUser.set('forgotPasswordValidationCode', '');
        //existingUser.set('validate-password', 'what the hell, UG?  don\'t expose passwords!');

        //existingUser.set('password', newPw);

        //existingUser.save(function(err) {

        setUserGridUserPassword(existingUser, newPw, function(err) {
          if (err) {
            resultCallback(2);
          } else {
            resultCallback(0);
          }
        });

      } else {
        resultCallback(3);
      }
    } else {
      resultCallback(err);
    }
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

  // todo: implement this in user grid, collection "apiUsers".  These values are just
  // copy/pasted from a sample record created there
  
  var result = undefined;
  
  if (apiKey === '63f54fd4-7cb2-11e2-b6ef-02e81ac5a17b') {
    var vals = {
      "id": apiKey,
      "associatedUserId": "b66a00ee-73d3-11e2-95c4-02e81ae640dc", // John B.
      "name": "SocialTagg Dev Shared API Account",
      "apiKey": apiKey,
      "password": "46ea0d5b246d2841744c26f72a86fc29",
      "authorizedOperations": [
        "userGet",
        "userPostActionVerificationEmail"
      ],
      "inactiveDate": "",
      "created": 1361511639758,
      "modified": 1361511639758
    }
    
    result = new ApiUser(vals);
  }
  
  resultCallback(result);
};

//
// Get an API user by a user id.  Returns undefined if not found.
//
exports.getApiUserByUserId = function(userId, resultCallback) {

  if (userId === 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' // Lavamantis
    || userId === '3d86497b-66c4-11e2-8b37-02e81ac5a17b' // jeff@socialtagg.com
    || userId === 'aabaf634-6eed-11e2-81cf-02e81ac5a17b') { // karim FB account
    
    thisModule.getApiUser('63f54fd4-7cb2-11e2-b6ef-02e81ac5a17b', resultCallback);
  } else {
    resultCallback(undefined);
  }
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

