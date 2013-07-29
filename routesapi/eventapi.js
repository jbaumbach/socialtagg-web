/**
 * User: jbaumbach
 * Date: 7/9/13
 * Time: 4:30 PM
 */

var userManager = require('./../data/userManager')
  , eventManager = require('./../data/eventManager')
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

    userManager.getUserEventsOwned(userId, function(err, userEvents) {

      if (userEvents && userEvents.length > 0) {

        console.log('(info) got events: ' + userEvents.length);

      } else {

        userEvents = [];
      }
      
      res.send(200, userEvents);
      
    });
  }

};

// todo: implement validator
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

  if (!eventRaw.startDate) {
    invalidDataMsgs.push('date is empty');
  }

  if (!eventRaw.durationHours) {
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

    eventRaw.owner = application.getCurrentSessionUserId(req);
    
    // insert to db
    eventManager.insertEvent(eventRaw, function(err, insertedEvent) {

      if (err) {
        
        res.send(500, { msg: err });

      } else {

        res.send(200, insertedEvent );
      }
    });
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

    // update event in db

    eventManager.updateEvent(eventRaw, function(err, updatedEvent) {

      if (err) {

        res.send(500, { msg: err });

      } else {

        res.send(200, updatedEvent );
      }

    })
  }

}

/*
Delete an event from the database.  Actually delete!
 */
exports.deleteOwnedEvent = function(req, res) {
  
  var uuid = req.params.id;
  
  console.log('(info) deleting event: ' + uuid);

  eventManager.deleteEvent(uuid, function(err) {
    if (err) {
      
      res.send(500, { msg: 'Error deleting item ' + uuid + ' from db'});
      
    } else {
      
      res.send(200, { msg: 'Successfully deleted item ' + uuid});
      
    }
  })
  
}

exports.eventSurvey = function(req, res) {
  
  var eventId = req.params.eventId;

  console.log('(info) found id: ' + eventId + ', is our id? ' + (eventId != '1234'));
  
  // todo: call event manager to grab the survey and questions for this id.  Then move the below there as
  // sample data.

  if (!eventId) {
    res.send(404, { msg: 'no event id provided'});
    
  } else if (eventId != '1234') {
    var msg = 'event id "' + eventId + '" not found';
    console.log('(warning) ' + msg);
    
    res.send(404, { msg: msg });
    
  } else {
    
    var result = {};
    result.uuid = '98765432';
    result.event_uuid = '1234';
    result.create_date = new Date();
    result.is_anonymous = true;
    result.inactive_ind = false;
    
    var questions = [];
    questions.push({ questionId: '1', type: 'scale_1to5', text: 'Overall, how successful was this event?' });
    questions.push({ questionId: '2', type: 'multichoice', text: 'What did you like best about the event?', choices: [
      'The laser dome', 'The open bar', 'The dance show', 'The venue'
    ] });
    questions.push({ questionId: '3', type: 'freeform', text: 'What would you change for next time?'});
    
    result.questions = questions;
    
    res.send(200, result);
  }
  
}