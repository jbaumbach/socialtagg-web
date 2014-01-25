var myApp = require(process.cwd() + '/app.js')
  , util = require('util')
  , globalFunctions = require(process.cwd() + '/common/globalfunctions')
  , client = require(process.cwd() + '/data/connectors/userGrid')
  , async = require('async')
  ;

/*

  This resets a sample/demo event owned by JB.  You can register youself, and there are a few
  attendees registered by default.  You can see it in a browser here:

  https://www.socialtagg.com/events/d295e83a-0f8a-11e3-a682-2346c22487a2
  https://staging.socialtagg.com/events/d295e83a-0f8a-11e3-a682-2346c22487a2
  https://development.socialtagg.com:3000/events/d295e83a-0f8a-11e3-a682-2346c22487a2

  Run the script with the command:

  $ node scripts/reset-johns-sample-event.js

  THere may be some errors in the console from the UG component - ignore those as long as
  you see a bunch of "success" messages interwoven.
  
  * Be sure to stop your dev website first or this will bomb out.
 
 */

var app = myApp.app();

// 'b9a9138a-4296-11e3-af47-51a116293e74';  // JBs unit test event - don't change 
// 
//'be1b65e0-3e71-11e3-a797-1399e22b12e3';   // ST F2F

var eventId = 'd295e83a-0f8a-11e3-a682-2346c22487a2';  // JB's test event

var userIdsToRegister = [];

async.waterfall([
  function grabAllUsersForEvent(cb) {
    console.log('1. running script...');

    var options = {
      type: 'event_users',
      qs: {
        // Note: you have to use '*' - specifying individual columns causes '.hasNextEntity()' on the 
        // collection to fail
        ql: util.format('select * where event_uuid = %s', eventId),
        limit: 100
      }
    }

    client().createCollection(options, cb); 
  },
  function deleteAllUsersForEvent(resultCollection, cb) {
    console.log('2. deleting users (if any)...');

    var usersToDelete = [];
    
    while (resultCollection.hasNextEntity()) {

      var collectionRow = resultCollection.getNextEntity(); // Note: ignoring errors here
      usersToDelete.push(collectionRow);
    }
    
    if (usersToDelete.length > 0) {
      async.each(usersToDelete, function(userToDelete, dcb) {
        userToDelete.destroy(dcb);
        
      }, cb);
      
    } else {
      
      cb();
    }
    
  }, 
  function addSampleUsersToEvent(cb) {
    console.log('3. adding sample users...');

    var newUsers = [
      'c238c31a-2d6a-11e3-898d-85fbe15c5ce8',  //joe
      '3d86497b-66c4-11e2-8b37-02e81ac5a17b',  //jeff
      'd31fb37f-7428-11e2-a3b3-02e81adcf3d0'  //jade
//      'c6911a5a-ce2b-11e2-9420-ef5ce7c13f4c'  // melissa
    ];
    
    async.each(newUsers, function(newUserId, acb) {
      var options = {
        "type": "event_users",
        "event_uuid": eventId,
        "registration_date": new Date().valueOf(),
        "user_uuid": newUserId,
        "name": 'name' + globalFunctions.md5Encode(newUserId + new Date().valueOf())
      };
      
      client().createEntity(options, acb);
    }, cb);
    
  },
  function deleteLavamantisAsAUser(cb) {
    async.waterfall([
      function getLavamantis(dlcb) {
        var options = {
          type: 'users',
          qs: {
            // Note: you have to use '*' - specifying individual columns causes '.hasNextEntity()' on the 
            // collection to fail
            ql: util.format('select * where email = \'lavamantis@gmail.com\''),
            //ql: util.format('select * where email = \'blah2@blah.com\''),
            limit: 100
          }
        }
        client().createCollection(options, dlcb);
      },
      function deleteLavamantis(rows, dlcb) {
        if (rows.hasNextEntity()) {
          var lavamantisRow = rows.getNextEntity();
          console.log('deleting lavamantis!');
          lavamantisRow.destroy(dlcb);
        } else {
          console.log('no lavamantis to delete!');
          dlcb();
        }
      }
    ], cb);
  }
], function getOuttaHere(err) {
  var exitCode = 0; // success
  if (err) {
    console.log('oops: ' + err);
    exitCode = 1;
  }
  
  console.log('goodbye...');
  process.exit(exitCode);
})



