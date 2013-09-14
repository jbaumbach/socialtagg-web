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
  , sprintf = require("sprintf-js").sprintf
  , _ = require('underscore')
  , thisModule = this
  ;

//
// Possible survey and question types.  These must match the Angular page values 
//
var surveyTypes = [
  { label: 'When attendee checks in', value: 'showOnCheckin' },
  { label: 'A specific number of minutes after event ends', value: 'showAfterXMins' },
  { label: 'The next morning', value: 'showNextMorn' }
];

var questionTypes = [
  { label: 'Scale of 1 to 5', value: 'scale_1to5' },
  { label: 'Multiple choice', value: 'multichoice' },
  { label: 'Freeform Input', value: 'freeform' }
];


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

      } else {

        userEvents = [];
      }
      
      res.send(200, userEvents);
      
    });
  }

};

/**
 * Validate a submitted survey's data fields.
 *
 * surveyRaw - the event data
 * 
 * Returns:
 *  an array of error messages that will get populated (cool future thing -
 *  use the field values as well, so the Angular form can automatically highlight the error fields)
 *
*/
exports.validateRawSurvey = function(surveyRaw) {

  var v = application.ErrorCollectingValidator();

  v.check(surveyRaw.whenToShowType, 'when to show type not selected').notNull();
  
  if (surveyRaw.whenToShowType) {
    
    if (!_.find(surveyTypes, function(type) { return surveyRaw.whenToShowType === type.value; })) {
      v.error('survey "when to show type" is not valid');
    };
  }

  if (surveyRaw.whenToShowType === 'showAfterXMins') {
    v.check(surveyRaw.whentoShowMins, 'enter valid number of minutes to show survey').isNumeric();
    
  }
  
  if (!surveyRaw.questions || surveyRaw.questions.length < 1) {
    
    v.error('please enter at least 1 survey question');
    
  } else {
    
    surveyRaw.questions.forEach(function(question, index) {
      
      var displayIndex = index + 1;
      v.check(question.text, 'please enter some text for question ' + displayIndex).notNull().notEmpty();

      if (!_.find(questionTypes, function(qtype) { return question.type === qtype.value; })) {
        v.error('please enter a valid type for question ' + displayIndex);
      };

      if (question.type === 'multichoice') {
        
        if (!question.choices || question.choices.length <= 1) {

          v.error('please enter at least two options for multiple choice question ' + displayIndex);
          
        } else {
          
          question.choices.forEach(function(choice, choiceIndex) {
         
            v.check(choice, 'please enter some text for choice ' + (choiceIndex + 1) + ' of question ' + displayIndex).notEmpty();
            
          });
        }
      }
    });
  }
  
  
  return v.getErrors();
  
};

/**
 * Validate a submitted event's data fields. 
 * 
 * eventRaw - the event data
 *
 * Returns:
 *  an array of error messages (cool future thing -
 *  use the field values as well, so the Angular form can automatically highlight the error fields)
 *
 *
 * Note: one small tech debt item:
 *
 * This function replaces the .startDate and .endDate values submitted by
 * the form as the user's date string with their parsed equivalents using
 * the user's entered time and timezone.  So, it's not strictly validating.
 * However, it seemed like the most logical place to put this behavior
 * since the user entered values ALSO are being validated here.
 * todo: A good fix would be change .startDate to .startDateTime and fill THAT in
 * with the built value.
 */
exports.validateRawEventAndConvertDates = function(eventRaw) {

  var v = application.ErrorCollectingValidator();

  v.check(eventRaw.owner, 'the event owner is not present').notNull();
  v.check(eventRaw.name, 'name should be between 1 and 100 chars').len(1, 100);
  v.check(eventRaw.description, 'description should not be blank').notNull();
  v.check(eventRaw.address, 'address should not be blank').notNull();
  v.check(eventRaw.timezoneOffset, 'timezone is not set or invalid').isInt().max(14).min(-14); // 14 either way as per 'moment' docs
  //v.check(eventRaw.checkinPeriodStartTimeMins, 'checkin period in minutes is not valid').isInt();

  
  // Assemble the date/time/timezone fields.  There may be a better
  // pattern, but a lot of refactoring will be required.  Let's 
  // just get 'er done for now.

  if (eventRaw.timezoneOffset) {
    
    eventRaw.startDate = application.getDatetimeFromStringParts(eventRaw.startDate, eventRaw.startTime, eventRaw.timezoneOffset);
    eventRaw.endDate = application.getDatetimeFromStringParts(eventRaw.endDate, eventRaw.endTime, eventRaw.timezoneOffset);
    
  }

  v.check(eventRaw.startDate, 'start date or time is blank or invalid').isInt();
  v.check(eventRaw.endDate, 'end date or time is blank or invalid').isInt();


  if (eventRaw.website) {
    v.check(eventRaw.website, 'website is not a valid url').isUrl();
  }
  
  return v.getErrors();
}

/*
  Insert an event into the DB
 */
exports.insertOwnedEvent = function(req, res) {
  
  var eventRaw = req.body;
  eventRaw.owner = application.getCurrentSessionUserId(req);
  var invalidDataMsgs = thisModule.validateRawEventAndConvertDates(eventRaw);
  
  if (invalidDataMsgs.length > 0) {
    
    res.send(400, { errors: invalidDataMsgs });
    
  } else {
    
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
  var invalidDataMsgs = thisModule.validateRawEventAndConvertDates(eventRaw);

  if (invalidDataMsgs.length > 0) {

    res.send(400, { errors: invalidDataMsgs });

  } else {

    //
    // todo: fix security hole - owner id is not checked with logged in user
    // 
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
  Inserts a new survey into the database
 */
exports.insertEventSurvey = function(req, res) {
  
  var surveyRaw = req.body;
  var invalidDataMsgs = thisModule.validateRawSurvey(surveyRaw);

  if (invalidDataMsgs.length > 0) {

    res.send(400, { errors: invalidDataMsgs });

  } else {

    // insert to db
    eventManager.insertSurvey(surveyRaw, function(err, insertedSurvey) {

      if (err) {

        res.send(500, { msg: err });

      } else {

        res.send(201, insertedSurvey );
      }
    });
  }
}

/*
  Updates a server in the database
 */
exports.updateEventSurvey = function(req, res) {
  
  var surveyRaw = req.body;
  var invalidDataMsgs = thisModule.validateRawSurvey(surveyRaw);

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

/*
  Get event analytics data from the database and return it to the client
 */
exports.eventAnalyticsData = function(req, res) {

  var type = req.query.type;
  
  var data;
  
  var done = function(err, data) {
    
    if (err) {

      var statusCode = err.statusCode || 500;
      var statusMsg = err.statusMsg || 'Unknown error';
      
      res.send(statusCode, { msg: statusMsg });
      
    } else {

      res.send(200, data);
    }

  };
  
  switch(type) {
    case 'checkinTimeSummary':
      
      // Test out the async nature of the responses
      setTimeout(function() {

        data = {
          labels: ['5pm', '6pm', '7pm', '8pm', '9pm'],
          datasets: [
            {
              data: [7, 10, 20, 15, 11]
            }
          ]
        }

        done(undefined, data);
      }, 500);
      
      break;
    
    case 'companySummary':
      data = {
        labels: ['Microsoft', 'Google', 'Facebook', 'SocialTagg'],
        datasets: [
          {
            data: [75, 60, 45, 12]
          }]
      }
      
      done(undefined, data);
      break;


    case 'titlesSummary':
      data = {
        labels: ['CEO', 'CTO', 'Director of Sys. Dev.', 'QA'],
        datasets: [
          {
            data: [34, 60, 48, 22]
          }]
      }

      done(undefined, data);
      break;

    default:
      done({ statusCode: 404, statusMsg: 'Unknown type: ' + type} );
  }
}