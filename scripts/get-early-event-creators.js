var myApp = require(process.cwd() + '/app.js')
  , util = require('util')
  , globalFunctions = require(process.cwd() + '/common/globalfunctions')
  , client = require(process.cwd() + '/data/connectors/userGrid')
  , async = require('async')
  , _ = require('underscore')
  ;

/*
 Run with the command:

 $ node scripts/get-early-event-creators.js

 THere may be some errors in the console from the UG component - ignore those as long as
 you see a bunch of "success" messages interwoven.

 * Be sure to stop your dev website first or this will bomb out.

 */

var app = myApp.app();

var eventList = [];

async.waterfall([
  function (cb) {
    console.log('1. running script...');

    var endDate = 1383334909455;    // Fri Nov 01 2013 12:41:49 GMT-0700 (PDT)
    var options = {
      type: 'events-sts',
      qs: {
        // Note: you have to use '*' - specifying individual columns causes '.hasNextEntity()' on the 
        // collection to fail
        ql: util.format('select * where created < %s', endDate),
        limit: 100
      }
    }

    client().createCollection(options, cb);
  },
  function (resultCollection, cb) {
    console.log('2. getting events (if any)...');

    while (resultCollection.hasNextEntity()) {
      var collectionRow = resultCollection.getNextEntity(); // Note: ignoring errors here
      
      var event = {
        name: collectionRow.get('event_name'),
        owner: collectionRow.get('owner')
      }
      
      //console.log('found: ' + util.inspect(event));
      if (!_.find(eventList, function(e) {
        return e.owner == event.owner; 
      })) {
        console.log('Adding event: ' + event.name);
        eventList.push(event);
      } else if (!event.owner) {
        console.log('Note: event has no owner! ' + event.name);
      } else {
        console.log('Skipping event: ' + event.name);
      };
    }

    cb();
  },
  function(cb) {
    async.each(eventList, function(event, elcb) {
      // Get owners

      var options = {
        type: 'users',
        uuid: event.owner
      };

      client().getEntity(options, function(err, user) {
        
        if (err) {
          console.log('Error, cannot look up user with id: ' + event.owner);
        } else if (user) {
          event.ownerUserName = user.get('username');
          event.ownerFName = user.get('first_name');
          event.ownerLName = user.get('last_name');
        } else {
          console.log('More weird, cannot look up user with id: ' + event.owner);          
        }
        
        elcb();
      });
      
    }, cb)
  }
], function getOuttaHere(err) {
  var exitCode = 0; // success
  if (err) {
    console.log('oops: ' + err);
    exitCode = 1;
  } else {
    eventList.forEach(function(event) {
      //console.log('found: ' + util.inspect(event));
      console.log('\'' + event.owner + '\',   // ' + event.ownerFName + ' ' + event.ownerLName);
    })
  }

  console.log('goodbye...');
  process.exit(exitCode);
})



