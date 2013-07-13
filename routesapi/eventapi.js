/**
 * User: jbaumbach
 * Date: 7/9/13
 * Time: 4:30 PM
 */

var userManager = require('./../data/userManager')
  , util = require('util')
  , globalfunctions = require('./../common/globalfunctions')
  , application = require('../common/application')
  ;

exports.eventsOwnedByUserId = function(req, res) {
  
  //
  // Grab user id from the session
  //
  //res.send(500, { msg: 'Not implemented yet, please try again later.'} );


  var userId = application.getCurrentSessionUserId(req);

  if (!userId) {
    console.log('(warning) eventsOwnedByUserId - ain\'t got a user id');

    res.send(500, { msg: 'can\'t get user id from the session - try logging in again' });
    
  } else {

    userManager.getUserEventsOwned(userId, function(userEvents) {

      if (userEvents && userEvents.length > 0) {

        console.log('(info) got events: ' + userEvents.length);

      } else {

        userEvents = [];
      }
      
      res.send(200, userEvents);
      
    });
  }

};

// todo: implement some kind of validation
function validateInputWithMsg(input, options, messageArray) {
  var errMsg;
  
}

/**
 * Validate a submitted event's data fields
 * 
 * eventRaw - the event data
 * invalidDataMsgs - (out) an array of error messages that will get populated (cool future thing - 
 *  use the field values as well, so the Angular form can automatically highlight the error fields)
 * 
 */
function validateRawEvent(eventRaw, invalidDataMsgs) {
  if (!eventRaw.name) {
    invalidDataMsgs.push('name is empty');
  }

  if (!eventRaw.description) {
    invalidDataMsgs.push('description is empty');
  }

  if (!eventRaw.address) {
    invalidDataMsgs.push('address is empty');
  }

  if (!eventRaw.date) {
    invalidDataMsgs.push('date is empty');
  }

  if (!eventRaw.hours) {
    invalidDataMsgs.push('event duration is empty');
  }

  // eventRaw.website is not required but should be validated
}

exports.insertOwnedEvent = function(req, res) {
  //
  // todo: implement saving.  Must return the new event.
  //
  
  var eventRaw = req.body;
  var invalidDataMsgs = [];
  
  validateRawEvent(eventRaw, invalidDataMsgs);
  
  if (invalidDataMsgs.length > 0) {
    
    res.send(400, { errors: invalidDataMsgs });
    
  } else {

    // insert to db
    
    var insertedEvent = eventRaw;
    insertedEvent.uuid = '1234567890';
    insertedEvent.created = new Date();
    insertedEvent.link = '/events/1234';
    
    res.send(200, insertedEvent );
  }
}

exports.updateOwnedEvent = function(req, res) {
  
  var uuid = req.params.id;

  var eventRaw = req.body;
  var invalidDataMsgs = [];

  validateRawEvent(eventRaw, invalidDataMsgs);

  if (invalidDataMsgs.length > 0) {

    res.send(400, { errors: invalidDataMsgs });

  } else {

    var updatedEvent = eventRaw;
    updatedEvent.modified = new Date();

    // update event in db

    res.send(200, updatedEvent);
  }

}

exports.deleteOwnedEvent = function(req, res) {
  
  var uuid = req.params.id;
  
  console.log('(info) deleting event: ' + uuid);
  
  res.send(200);
  
}