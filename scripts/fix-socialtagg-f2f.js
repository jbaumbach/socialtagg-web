var myApp = require(process.cwd() + '/app.js')
  , util = require('util')
  , globalFunctions = require(process.cwd() + '/common/globalfunctions')
  , client = require(process.cwd() + '/data/connectors/userGrid')
  , async = require('async')
  ;

// dont run this unless you know what you're doing
process.exit(1);

var app = myApp.app();

// 'b9a9138a-4296-11e3-af47-51a116293e74';  // JBs unit test event - don't change 
// 
var eventId = 'be1b65e0-3e71-11e3-a797-1399e22b12e3';   // ST F2F


var registerUser = function(userId, eventId, callback) {

  var result = undefined;

  var d = 1382814534021;  // new Date().valueOf();
  
  var options = {
    "name": 'reg' + globalFunctions.md5Encode(eventId + new Date() + userId),
    "type": "event_user",
    "checkin_date": d,
    "event_uuid": eventId,
    "registration_date": d,
    "user_uuid": userId
  }

  console.log('registering: ' + userId);
  
  client().createEntity(options, function(err, registered) {
    callback(err, registered);
  });
}


// All of us
var userIdsToAddToEvent = [
  'c238c31a-2d6a-11e3-898d-85fbe15c5ce8',
  'b66a00ee-73d3-11e2-95c4-02e81ae640dc',
  'd31fb37f-7428-11e2-a3b3-02e81adcf3d0',
  '0a0f9599-9921-11e2-b8af-02e81ae640dc',
  '3d86497b-66c4-11e2-8b37-02e81ac5a17b',
  '5893116a-275a-11e3-be34-f9ef93e2dea2',
  '9c1f4cda-e2d3-11e2-a4b4-3ba51af19848',
  '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8'
]

async.each(userIdsToAddToEvent, function(userId, cb) {
  registerUser(userId, eventId, cb) 
}, function(err) {
  console.log('done!');
  process.exit(0);

})