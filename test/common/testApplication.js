/**
 * User: jbaumbach
 * Date: 2/12/13
 * Time: 12:13 AM
 */


var assert = require('assert')
  , application = require('../../common/application')
  , userManager = require('../../data/userManager')
  , globalFunctions = require('../../common/globalfunctions') // Case sensitive require!!!
  , User = require('../../models/User')
  , util = require('util')
;

//
// Temp variable to hold the existing function pointer in userManager.
//
var tempUserManagerGetUser
  , tempGlobalFunctionsGetSessionInfo
  ;


describe('application class', function() {

  before(function() {
    //
    // Record existing function pointer.
    //
    tempUserManagerGetUser = userManager.getUser;
    tempGlobalFunctionsGetSessionInfo = globalFunctions.getSessionInfo;
  });

  after(function() {
    //
    // Reset the user manager, or other tests in this run could fail.
    //
    userManager.getUser = tempUserManagerGetUser;
    globalFunctions.getSessionInfo = tempGlobalFunctionsGetSessionInfo;
  });

  it('should get a user from the session ok', function(done) {
    var sampleUserId = 'blah';
    var sampleName = 'Lando';
    
    //
    // Let's mock some functions out.
    //
    globalFunctions.getSessionInfo = function() {
      return { userId: sampleUserId };
    };

    userManager.getUser = function(userId, callback) {
      callback(new User( { id: userId, name: sampleName } ));  
    };
    
    application.getCurrentSessionUser({}, function(retreivedUser) {
      assert.equal(sampleUserId, retreivedUser.id, 'Didn\'t get right id back');
      assert.equal(sampleName, retreivedUser.name, 'Did not get right name back');
      
      done();
    });
  });

  it('should return empty object from session if no user logged in', function(done) {

    globalFunctions.getSessionInfo = function() {
      return { userId: undefined };
    };

    application.getCurrentSessionUser({}, function(retreivedUser) {
      assert.equal(undefined, retreivedUser.userId, 'Did not get empty object back');

      done();
    });
  });
});
  