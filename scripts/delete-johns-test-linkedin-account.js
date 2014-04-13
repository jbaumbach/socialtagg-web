var myApp = require(process.cwd() + '/app.js')
  , util = require('util')
  , globalFunctions = require(process.cwd() + '/common/globalfunctions')
  , async = require('async')
  , client = require(process.cwd() + '/data/connectors/userGrid')
  , userManager = require(process.cwd() + '/data/userManager')
  ;

/*

 This deletes John's test LinkedIn account from usergrid.
 
 * Be sure to stop your dev website first or this will bomb out.

 */

var app = myApp.app();


async.waterfall([
  function grabUGUser(cb) {
    var options = {
      type: 'users',
      qs: {
        ql: util.format('select * where email = \'%s\'', 'jbaumbach@fanfavoritedesigns.com'),
        limit: '100'
      }
    };

    client().createCollection(options, function (err, existingUsers) {
      if (err) {
        // Crap
        cb(err);

      } else {
        if (existingUsers.hasNextEntity()) {

          var existingUser = existingUsers.getNextEntity();
          cb(null, existingUser);

        } else {
          cb();
        }
      }
    });

  },
  function zapIt(user, cb) {
    if (user) {
      console.log('found user, deleting!');
      user.destroy(cb);
    } else {
      console.log('no user found!');
      cb();
    }
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



