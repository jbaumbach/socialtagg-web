/*

  Test the user manager functions.  Although it tests your database functionality, it
  should be completely agnostic of your chosen database.  This allows you to swap in and out
  database technologies pretty easily without having to refactor your code.
  
  At this time, however, using MongoDb requires a little bit of db-specific futzing for 
  the tests to work.
  
  Todo: move the db object to an agnostic class that does the connecting/deconnecting/waiting.

 */
var assert = require('assert');
var userManager = require('../../data/userManager');
//var db = require('../../data/connectors/mongo'); // uncomment this to use Mongo instead
var ApiUser = require('../../models/ApiUser');
var User = require('../../models/User');

//
// For the "existing user" test(s) to work, create this user in your interface so it 
// saves to the database.  Then set the fields here, especially the user id.
//
/* MongoDB user 
var existingUserId = '50f1ebc3dd71688aad448b62';
var existingUserName = 'Thomas Anderson';
var existingUserEmail = 'neo@thematrix.com';
var existingUserPW = 'neo123';
*/

var existingUserId = '3d86497b-66c4-11e2-8b37-02e81ac5a17b';
var existingUserName = 'Jeff Mock';
var existingUserEmail = 'jeff@socialtagg.com';
var existingUserPW = 'tbd';

//
// Delay to let db connection start.  This seems to be about right.  Any less, the tests will fail.
//
var connectionWaitTimeMs = 500;

//
// Mongo takes a while to connect, and all queries sent before the connection is made will timeout,
// and bomb out our tests.
//
describe('userManager', function() {
  //
  // Give the tests time to connect to the database and run
  // 
  this.timeout(9000);
  
  //
  // MongoDB only: Tests should close the database connection when done so we don't run out of connections.
  // But don't blow out other tests that might be running.  To ponder: a better solution.
  //
  after(function() {
    setTimeout(function() {
      //db.close();
    }, 8000);
  })
  
  //
  // If you don't have the above existing user created, these tests will fail.  I recommend
  // keeping these to keep a safety net of regression tests around in case you forget something
  // when you're refactoring your db in the future.
  // 
  it('(optionally) should get an existing user', function(done) {
    
    //
    // Mongo seems to take a while to connect, so let's wait a couple secs before
    // running the first test.
    //
    setTimeout(function() {
      userManager.getUser(existingUserId, function(resultUser) {
        assert.equal(resultUser.name, existingUserName, 'User name incorrect');
        done();
      });
    }, connectionWaitTimeMs);
    
  });

  it('(optionally) should fail with wrong password for an existing user', function(done) {
    userManager.validateCredentials(existingUserEmail, 'badpassword', function(nouser) {
      assert.equal(nouser, undefined);
      done();
    })
  });
  
  //
  // This tests the full cycle of CRUD actions, and cleans up afterwards.
  //
  it.skip('should insert, get, update, validate, then delete a user', function(done) {
    var user = {
      name: 'Darth',
      address: 'Death Star',
      email: 'hello@there.com',
      password: '12345'
    };
    
    userManager.upsertUser(user, function(upsertedUser) {
      var newId = upsertedUser.id;
      
      assert.notEqual(newId, undefined, 'Upsert didn\'t return a user id');
      
      assert.equal(user.name, upsertedUser.name, 'Wrong name after insert');
      assert.equal(user.address, upsertedUser.address, 'Wrong address after insert');
      assert.equal(user.email, upsertedUser.email, 'Wrong email after insert');
      assert.equal(user.password, upsertedUser.password, 'Wrong password after insert');
      
      userManager.getUser(newId, function(gottenUser) {
        assert.equal(user.name, gottenUser.name, 'Wrong name after get');
        assert.equal(user.address, gottenUser.address, 'Wrong address after get');
        assert.equal(user.email, gottenUser.email, 'Wrong email after get');
        assert.equal(user.password, gottenUser.password, 'Wrong password after get');
        
        var updatedName = 'Boba Fett';
        var updatedAddr = 'Tatooine';
        
        gottenUser.name = updatedName;
        gottenUser.address = updatedAddr;
        
        userManager.upsertUser(gottenUser, function(updatedUser) {
          assert.equal(updatedUser.name, updatedName, 'Wrong name after update');
          assert.equal(updatedUser.address, updatedAddr, 'Wrong address after update');
          assert.equal(updatedUser.email, user.email, 'Somehow email changed after update');          
          assert.equal(updatedUser.password, user.password, 'Somehow password changed after update');
          
          userManager.validateCredentials(updatedUser.email, updatedUser.password, function(validatedUser) {
            assert.equal(validatedUser.name, updatedName, 'Unable to validate user');
            
            userManager.deleteUser(newId, function(err) {
              assert.equal(err, undefined, 'Delete user had error');

              done();
            })
          })
        })
      });
    });
  })

  //
  // This tests the full cycle of CRUD actions for an api user, and cleans up afterwards.
  //
  it.skip('should insert, get (two ways), then delete an api user', function (done) {
    var expectedPWLength = 32;
    var apiUser = new ApiUser();

    apiUser.associatedUserId = existingUserId;

    userManager.upsertApiUser(apiUser, function (upsertedApiUser) {

      var newApiKey = upsertedApiUser.apiKey;
      var newApiPW = upsertedApiUser.password;

      assert.equal(expectedPWLength, newApiKey.length, 'New api key not right length');
      assert.equal(expectedPWLength, newApiPW.length, 'New api pw not right length');

      userManager.getApiUser(newApiKey, function (gottenUser) {

        assert.equal(newApiPW, gottenUser.password, 'Wrong password after get');

        userManager.getApiUserByUserId(existingUserId, function(gotten2User) {

          assert.equal(newApiPW, gotten2User.password, 'Wrong password after get by uid');
          
          userManager.deleteApiUser(newApiKey, function (err) {
            assert.equal(err, undefined, 'Delete user had error');

            done();
          })
        })
      })
    })
  });

  it('should get an existing user\'s contaggs', function(done) {
    userManager.getUserContaggs(existingUserId, function (resultList) {
      
      assert.notEqual(resultList, undefined, 'didn\'t get results back');
      assert.ok(resultList.length > 5, 'didn\'t seem to get all contaggs back');
      
      done();
    });  
  });


  //
  // Note: for the next few tests, we're not abstracting away the usergrid-specific 
  // uuid to an id.  Eh, prolly ok in small doses, since it's not super useful to 
  // create application models and mappers.  But this'll have to be updated if 
  // the underlying data store changes.
  //
  
  it('should populate user contaggs', function(done) {
    var sampleContaggsList = [
      { uuid: 'f32063c6-7409-11e2-96f4-02e81ac5a17b',  // Jeff M.
        created: 1360574380162 }
      , { uuid: '93b6a35c-67ce-11e2-8b37-02e81ac5a17b',  // Also Jeff M.
        created: 1359969784321 }
    ];
    
    userManager.populateUserContaggs(sampleContaggsList, function(result) {

      assert.equal(result.length, sampleContaggsList.length, 'didn\'t return all results');
      done();

    });
    
  });
  
  it('should add a contagg', function(done) {
    var userId = 'b66a00ee-73d3-11e2-95c4-02e81ae640dc'; // John B. / lavamantis
    var user = new User({ id: userId });
    //var userIdToAdd = 'f32063c6-7409-11e2-96f4-02e81ac5a17b'; // Jeff M.
    var userIdToAdd = 'aabaf634-6eed-11e2-81cf-02e81ac5a17b'; // Karim
    
    userManager.addUserContagg(user, userIdToAdd, function(resultContagg) {
      
      assert.ok(resultContagg != undefined, 'didn\'t get anything back');
      assert.equal(resultContagg.get('uuid_user'), userId, 'didn\'t get right user id back');
      assert.equal(resultContagg.get('uuid_contagg'), userIdToAdd, 'didn\'t get right added id back');
      
      done();
    });
  });
  
  it('should return 1 for setting user verification code for nonexistant email', function(done) {
    
    var code = '123456';
    var badEmail = 'blah@blahblah.com';
    
    userManager.setUserVerificationCodeByEmail(code, badEmail, function(err, code) {
      
      assert.equal(err, 1, 'didn\'t get 1 back for bad email');
      done();
    });
  });

  it('should return 0 for setting user verification code for good email', function(done) {

    var code = '123456';
    var goodEmail = 'john.j.baumbach@gmail.com';

    userManager.setUserVerificationCodeByEmail(code, goodEmail, function(err, code) {

      assert.equal(err, 0, 'didn\'t get 0 back for bad email');
      done();
    });
  });


  // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  // All new tests should go above this line
});
