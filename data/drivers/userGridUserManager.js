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
  , eventManager = require('../eventManager')
  , userGridEventManager = require('./userGridEventManager')
  , https = require('https')
  , async = require('async')
  , thisModule = this
  ;


/*
  Constants
 */

exports.publicUri = 'https://api.usergrid.com/tagg/tagg';


//********************************************************************************
// User functions
//********************************************************************************

//
// Maps a User Grid user to our app's user
//
exports.userFromUserGridUser = function(userGridUser) {
  
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

exports.isFirstFbLogin = function(fbUser) {
  // Assumption: all new facebook records created in UG have username like 'fb_[some integers]'
  
  var result = fbUser.username.match(/^fb_[0-9]+$/i);
  
  return result;
}

/*
  Takes the record from FB->UG and converts it to a SocialTagg user
 */
exports.userFromFBLoginUser = function(fbUser) {
  
  var data = {
    id: fbUser.uuid,
    userName: fbUser.facebook.email,
    name: fbUser.name || fbUser.facebook.name,
    firstName: fbUser.first_name || fbUser.facebook.first_name,
    lastName: fbUser.last_name || fbUser.facebook.last_name,
    address: fbUser.postal_address,
    email: fbUser.email || fbUser.facebook.email,
    phone: fbUser.tel,
    pictureUrl: application.processImageUrlForLargerSize(fbUser.picture),
    createDate: fbUser.created,
    createDateStr: new Date(fbUser.created).toDateString(),
    website: fbUser.website || fbUser.url,
    bio: fbUser.bio,
    company: fbUser.company,
    title: fbUser.title,
    twitter: fbUser.twitter,
    avatarId: fbUser.uuid_avatar_image
  }
  
  return new User(data);
}

/*
  Get a UG user reg from a user registration object
 */
function userGridUserRegFromUserRegInfo(userReg) {
  var result = {
    
    type: 'registrations',
    
    email: userReg.email,
    validation_code: userReg.validationCode 
  }

  if (!userReg.uuid) {
    
    // Name is a special param - see notes in the other functions
    result.name = 'reg' + globalFunctions.md5Encode(userReg.email + userReg.validationCode + new Date());
    
  } else {
    
    result.uuid = userReg.uuid;
  }
  
  return result;
}

/*
  Get a user registration object from a UG user reg object
 */
function userRegFromUserGridUserReg(ugUserReg) {
  
  var result = {
    email: ugUserReg.get('email'),
    validationCode: ugUserReg.get('validation_code'),
    uuid: ugUserReg.get('uuid')
  }
  
  return result;
}

//
// Maps a User Grid user to our app's user
//
function userGridUserFromUser(user) {

  var result = {
    
    type: 'users',
    
    username: user.userName,
    //name: user.name,
    first_name: user.firstName,
    last_name: user.lastName,
    postal_address: user.address,
    email: user.email,
    tel: user.phone,
    // not yet: user.pictureUrl:,
    website: user.website,
    bio: user.bio,
    company: user.company,
    title: user.title,
    twitter: user.twitter
    // not yet: uuid_avatar_image: user.avatarId

    // Adding 9/2/2013 to support password changing
    // password: user.password

};
  
  if (!user.uuid) {

    //
    // Inserting
    //
    // Must create a unique value for 'name' according to the UG docs:
    // http://apigee.com/docs/usergrid/content/data-model
    //
    // It has some restrictions as far as allowed characters, which apparently
    // are undocumented.  Let's use MD5 to be safe.
    //
    result.name = 'name' + globalFunctions.md5Encode(user.username + user.email + new Date());
    
  } else {
    
    result.uuid = user.uuid;
  }
  
  return result;
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
      result = thisModule.userFromUserGridUser(existingUser);
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
  
  //
  // How to make generic calls: https://github.com/apigee/usergrid-node-module
  //
  
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


exports.getUuidOfNewEntity = function(userGridRestResponse) {
  
  var result;
  
  if (userGridRestResponse && userGridRestResponse.entities && userGridRestResponse.entities.length > 0) {
    result = userGridRestResponse.entities[0].uuid;
  }
  
  return result;
}

/*
 Looks up the passed Facebook access token and grabs the user from the db
 Parameters:
   accessToken: the access token returned from Facebook when user logged into the OAuth thingy
   resultCallback: a callback function with this signature:
     err: populated if something bad happened
     user: the user object if we have one
 */
exports.validateFacebookLogin = function(accessToken, resultCallback) {

  //
  // This magical url will go to FB and do OAuth stuff, and ultimately return a new/existing UG user
  //
  var url = util.format('https://api.usergrid.com/tagg/tagg/auth/facebook?fb_access_token=%s', accessToken);
 
  console.log('(info) validateFacebookLogin: calling: ' + url);
  
  globalFunctions.getDocumentAtUrl(url, function(err, ugResponse) {
  
    if (err) {
      
      console.log('(error) validateFacebookLogin 1: err: ' + err);
      resultCallback(err);
      
    } else if (ugResponse.response.statusCode != 200) {
      
      console.log('(error) validateFacebookLogin 2: err: ' + ugResponse.response.statusCode);
      resultCallback(ugResponse.response.statusCode);
      
    } else if (!ugResponse) {

      console.log('(error) validateFacebookLogin 3: no response!');
      resultCallback('weird - no response object but all is good???');
      
    } else {
      
      var ugUserRaw = JSON.parse(ugResponse.body);

      if (ugUserRaw && ugUserRaw.access_token && ugUserRaw.user) {

        var isFreshlyCreatedAccount = thisModule.isFirstFbLogin(ugUserRaw.user);
        
        //
        // Unexpected behavior: sometimes the object comes back as my REGULAR ACCOUNT, which seems
        // impossible.  Perhaps UG is checking email address or something??  In any case, a non-FB
        // account can't be processed like a FB account, so do something different
        //
        var isFromFb = ugUserRaw.user.facebook;
        
        if (isFromFb) {
          var user = thisModule.userFromFBLoginUser(ugUserRaw.user);
  
          //
          // Todo: we should really save the created user to UG if this is the first login, otherwise the apps
          // may have bogus data.  It should be doable if the above function returns a 'dirty' flag or something of that
          // nature.  Maybe it can just check the user id.
          // 
          if (!isFreshlyCreatedAccount) {
            
            resultCallback(null, user);
            
          } else {
            
            thisModule.upsertUser(user, function(err, newUser) {
              resultCallback(err, newUser);
            }); 
          }
        } else {
          
          var user = thisModule.userFromUserGridUser(ugUserRaw.user);
          resultCallback(null, user);
        }
        
      } else {
      
        var msgPre = 'weird - can\'t parse JSON from UG or it\'s missing stuff.';
        var msg = msgPre + '  It was: ' + util.inspect(ugResponse);
        console.log('(error) validateFacebookLogin 4: ' + msg);
        
        resultCallback(msgPre + ' Check logs for details');
        
      }
    }
  });
}
  
/*
  Get a user from UG for the passed id
  Parameters:
    id: the usergrid user id, aka uuid
    resultCallback: a function with signature:
      user: the retreived user, or undefined if not found (or error)
 */
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

/*
  Get a user by email address.  
  Parameters:
    emailAddr: the email address
    resultCallback: a callback with the signature:
      user: the user with that email, or undefined
 */
exports.getUserByEmail = function(emailAddr, resultCallback) {
  
  var result = undefined;
  
  getUserGridUserByEmail(emailAddr, function(err, userGridUser) {
    if (err === 0) {
      result = thisModule.userFromUserGridUser(userGridUser);
    } 
    
    resultCallback(result);
  });
  
};

/*
  Looks up a validation record by email address
  Parameters:
    email: the email address to look up
    resultCallback: function with this signature:
      err: filled in if there was an error
      ugReg: an updateable usergrid registration if we found one, otherwise undefined
 */
exports.getUGRegistrationByEmail = function(email, resultCallback) {

  var options = {
    type: 'registrations',
    qs: {
      // Note - you must use SINGLE QUOTES around a string value to search for
      ql: util.format('select * where email = \'%s\'', email),
      limit: '100'
    }
  };

  client().createCollection(options, function (err, existingUserReg) {
    
    if (err) {
      // Crap
      resultCallback(err);

    } else {

      var result;
      
      if (existingUserReg.hasNextEntity()) {

        result = existingUserReg.getNextEntity();
      }
      
      resultCallback(err, result);
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
  
  thisModule.getUGRegistrationByEmail(email, function(err, ugReg) {
    if (err) {
      resultCallback(err);
      
    } else {
      var result;
      
      if (ugReg) {
        result = userRegFromUserGridUserReg(ugReg);  
      }
      
      resultCallback(undefined, result);
    }
  });
}

/*
 Inserts a user registration record.
 Parameters:
   userReg: object with email, password, and reg validation code fields
   resultCallback: function with signature:
     err: filled in if there's an error
     user: the user reg info
 */
exports.upsertUserRegistration = function(userReg, resultCallback) {

  var ugOptionsToUpdateOrInsert = userGridUserRegFromUserRegInfo(userReg);

  
  thisModule.getUGRegistrationByEmail(userReg.email, function (err, existingUserReg) {
    if (err) {
      // Crap
      resultCallback(err);

    } else {

      //
      // Common outta-here function
      //
      function donezo(err, ugUser) {
        var result;
        if (!err) {
          result = userRegFromUserGridUserReg(ugUser);
        }
        resultCallback(err, result);
      }
      
      if (existingUserReg) {
        
        // Update
        existingUserReg.set(ugOptionsToUpdateOrInsert);
        existingUserReg.save(function(err) {

          donezo(err, existingUserReg);
        })

      } else {
        
        // Insert
        client().createEntity(ugOptionsToUpdateOrInsert, function(err, ugUserReg) {
          
          donezo(err, ugUserReg);
        });
      }
    }
  });
}


/*
  Upsert the passed user in the data store.
  Parameters:
    user: the user object to upsert in the database.  The id is the key.  If there 
          is a .password field, the user password is also updated.
    resultCallback: a function with signature:
      err: filled in if something bad happened
      user: the new or updated user object
*/
exports.upsertUser = function(user, resultCallback) {
  var result = undefined;

  var isInsert = !user.id;
  var options = userGridUserFromUser(user);
  
  client().createEntity(options, function(err, ugUser) {

    if (!err) {

      function setPassword(ugUser, callback) {
        
        if (user.password && user.password.length > 0) {
          setUserGridUserPassword(ugUser, user.password, callback);
          
        } else {
          callback();
        }
      } 
      
      if (isInsert) {

        // The user returned is a completed new user - let's return it
        
        setPassword(ugUser, function() {
          result = thisModule.userFromUserGridUser(ugUser);
          resultCallback(err, result);
        });

      } else {

        // The user returned is the old data in UG.  Overwrite it, save, and return the updated
        // user.
        
        var dataToSave = userGridUserFromUser(user);
        var result;

        ugUser.set(dataToSave);
        ugUser.save(function(err) {

          if (!err) {
            
            setPassword(ugUser, function() {
              result = thisModule.userFromUserGridUser(ugUser);
              resultCallback(err, result);
            });
            
          } else {
            resultCallback(err);
          }
        });
      }
    } else {

      resultCallback(err);
    }
  }); 
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

  console.log('getUserContaggs: ' + util.inspect(options));
  
  getUserContaggsByOptions(options, resultCallback);
  
};

exports.populateUserContaggs = function(userContaggIdList, resultCallback) {
  var resultUsers = undefined;
  var currentResultCount = 0;
  var expectedResultCount = userContaggIdList.length;
  
  //
  // Todo: refactor this function to use the 'async' library - that 
  // coordinates parallel execution
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

/**
 * Call UserGrid with the passed options, and run each result through the converter function,
 * returning the result array to the callback function
 * @param {object} options the usergrid "options" object
 * @param {function} converterFunc the function to call passing each data row.  This function must return a model. 
 * @param {function} resultCallback the function to call once all the rows are converted.  The signature is:
 *  err {string} if something bad happened
 *  results {array} the resulting models
 */
var getUGResultSetAndConvertRowsToObjects =
exports.getUGResultSetAndConvertRowsToObjects = function(options, converterFunc, resultCallback) {
  
  client().createCollection(options, function(err, resultRows) {
    
    var result = undefined;

    if (err) {
      console.log('(error) getUGResultSetAndConvertRowsToObjects (' + util.inspect(options) + '): ' + err);
    } else {
      result = [];
      
      while(resultRows.hasNextEntity()) {
        var ugRow = resultRows.getNextEntity();
        var model = converterFunc(ugRow);
        result.push(model);
      }
    }
    
    resultCallback(err, result);
  });
}

//
// Get the events this user has attended
//
exports.getUserEventsAttended = function(id, resultCallback) {
  
  var options = {
    type: 'event_users',
    qs: {
      ql: util.format('select * where user_uuid = %s order by created DESC', id),
      limit: '100'
    }
  }

  var converterFunc = userGridEventManager.eventUserFromUserGridEventUser;
  
  getUGResultSetAndConvertRowsToObjects(options, converterFunc, resultCallback);
}

/**
 * For each of the passed eventUser objects, add an 'Event' property
 * @param {array} array of eventUser objects
 * @param {function} resultCallback, with parameters:
 *  err {object} filled in if something bad happened
 */ 
exports.populateEvents = function(eventUserList, resultCallback) {
  //
  // Let's run a bunch of queries in parallel
  //
  var iterator = function(item, callBack) {
    
    eventManager.getEvent(item.eventUuid, function(err, event) {
      //
      // Yes, we are ignoring errors in the list.  If one bombs, we can still
      // show the rest, right?
      //
      item.event = event;
      callBack();
    });
  }
  
  async.each(eventUserList, iterator, resultCallback);
}


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
//    err: defined if an error occurred
//    events: fully populated array of Event objects.
//
exports.getUserEventsOwned = function(id, resultCallback) {
  
  var result = undefined;

  var options = {
    type: 'events-sts',
    qs: {
      ql: util.format('select * where owner = %s and not inactive_ind = \'true\' order by created DESC', id),
      limit: '100'
    }
  }
  
  client().createCollection(options, function(err, resultEvents) {
    if (err) {
      
      console.log('(error) userGridUserManager.getUserEventsOwned: ' + err);
      
    } else {
      
      result = [];
      
      while(resultEvents.hasNextEntity()) {

        var event = resultEvents.getNextEntity();
        var userEvent = userGridEventManager.eventFromUserGridEvent(event);
        
        // console.log('Found event: ' + util.inspect(userEvent));
        
        result.push(userEvent);

      }
    }

    resultCallback(err, result);

  });
}

  
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

  // First, create an 'assets' record
  
  var ugOptions = {
    method:'POST',
    endpoint:'assets',
    body:{ 
      name: options.fileName,
      owner: options.userId,
      'content-type': options.mime,
      path: '/assets/profile_avatars/' + globalFunctions.md5Encode(options.fileName + options.userId + new Date())
    }
  };

  console.log('about to write: ' + util.inspect(ugOptions));
  
  client().request(ugOptions, function (err, data) {
    
    if (err) {
      
      resultCallback(err);
      
    } else {

      console.log('got back from UG: ' + util.inspect(data));
      
      var newUuid = thisModule.getUuidOfNewEntity(data);
      
      if (!newUuid) {
        
        resultCallback('couldn\'t get uuid from new entity');
        
      } else {
        
        // Then, upload the image
        
        var targetUrl = '/assets/' + newUuid + '/data';

        var imgOptions = {
          method: 'POST',
          endpoint: targetUrl,
          body: options.data,
          contentType: 'application/octet-stream' // <- failed experiment
        }

        //console.log('about to write: ' + util.inspect(imgOptions));

        client().request(imgOptions, function(err, imgData) {
          
          if (err) {
            
            resultCallback(err);
            
          } else {

            console.log('ok, now got: ' + imgData);
            
            // Finally, delete any other assets


            // Outta here

            var resultUrl = thisModule.publicUri + targetUrl;
            
            resultCallback(undefined, resultUrl);
            
          }
        });
      }
    }
  });
}

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

