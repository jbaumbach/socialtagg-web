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

/*
  Return a list of events owned by the logged in user
 */
exports.eventsOwnedByUserId = function(req, res) {
  
  //
  // Grab user id from the session
  //

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

/*
  Insert an event into the DB
 */
exports.insertOwnedEvent = function(req, res) {
  
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

/*
  Update an event in the database
 */
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
  Delete an event from the database.  Don't actually delete, just 
  inactivate.
 */
exports.deleteOwnedEvent = function(req, res) {
  
  var uuid = req.params.id;
  
  if (!uuid) {

    res.send(400, { msg: 'no event id provided'});

  } else {

    eventManager.getEvent(uuid, function(err, event) {

      if (err) {

        res.send(500, { msg: 'a server error has occurred!'});

      } else if (!event) {

        res.send(404, { msg: util.format('event id "%s" not found', uuid)});

      } else {

        event.inactiveInd = 'true';
        
        eventManager.updateEvent(event, function(err, event) {
   
          if (!err) {
            
            res.send(200, { msg: 'deleted event ok'} );
            
          } else {
            
            res.send(500, { msg: 'a server error has occurred!'});

          }
        });
      }
    })
  }
}

/*
  Get an event survey
 */
exports.getEventSurvey = function(req, res) {
  
  var eventId = req.params.eventId;

  console.log('(info) found id: ' + eventId + ', is our id? ' + (eventId != '1234'));
  
  if (!eventId) {
    
    res.send(400, { msg: 'no event id provided'});
    
  } else {

    eventManager.getSurveyByEventId(eventId, function(err, survey) {
      
      if (err) {
        
        res.send(500, { msg: 'a server error has occurred!'});
        
      } else if (!survey) {
        
        res.send(404, { msg: util.format('event id "%s" not found', eventId)});
        
      } else {
        
        res.send(200, survey);
      }
    })
  }
  
}

/*
  Todo: validate survey fields when submitted
 */
function validateRawSurvey(surveyRaw, invalidDataMsgs) {
  return invalidDataMsgs;
}

/*
  Inserts a new survey into the database
 */
exports.insertEventSurvey = function(req, res) {
  
  var surveyRaw = req.body;
  var invalidDataMsgs = [];

  validateRawSurvey(surveyRaw, invalidDataMsgs);

  if (invalidDataMsgs.length > 0) {

    res.send(400, { errors: invalidDataMsgs });

  } else {

    // insert to db
    eventManager.insertSurvey(surveyRaw, function(err, insertedSurvey) {

      if (err) {

        res.send(500, { msg: err });

      } else {

        res.send(200, insertedSurvey );
      }
    });
  }
}

/*
  Updates a server in the database
 */
exports.updateEventSurvey = function(req, res) {
  
  var surveyRaw = req.body;
  var invalidDataMsgs = [];

  validateRawSurvey(surveyRaw, invalidDataMsgs);

  if (invalidDataMsgs.length > 0) {

    res.send(400, { errors: invalidDataMsgs });

  } else {

    // insert to db
    eventManager.updateSurvey(surveyRaw, function(err, updatedSurvey) {

      if (err) {

        res.send(500, { msg: err });

      } else {

        res.send(200, updatedSurvey );
      }
    });
  }
  
}