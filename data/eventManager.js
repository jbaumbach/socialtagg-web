/**
 * User: jbaumbach
 * Date: 7/14/13
 * Time: 6:20 PM
 */

var
  db = require('./drivers/userGridEventManager')
  , globalFunctions = require('../common/globalfunctions')
  , thisModule = this
  , cache = require('../common/cache')
  , async = require('async')
  ;


/**
 * Inserts an event into the database
 Parameters: 
  event - the event to insert.  The owner id should be filled in already.
  callback - the callback function, with this signature:
    err - description of any errors that occurred
    createdEvent - the new event that was created (has the new event uuid)
 */
exports.insertEvent = function(event, callback) {
 db.insertEvent(event, callback); 
}

/**
 Delete an event from the database

 Parameters:
 eventId - the event id
 callback - called when done, with this signature:
 err - filled in if something went wrong
 */
exports.deleteEvent = function(eventId, callback) {
  db.deleteEvent(eventId, callback);
}

/**
 Update an existing event in the usergrid database

 Parameters:
 event - the event data to insert.  The owner id should be filled in already.
 See the Angular form data and model for data object field names, they're
 slightly different than the property names.
 callback - the callback function, with this signature:
 err - description of any errors that occurred
 createdEvent - the new event that was created (has the new event uuid)
 */
exports.updateEvent = function(event, callback) {
  db.updateEvent(event, callback);
}

/**
 Get an existing event from the DB.

 Parameters:
 eventId: the event's uuid value
 callback: a function with this signature:
   err: a description if something went wrong
   event: a SocialTagg "Event" object with the retreived data
 */
exports.getEvent = function(eventId, callback) {
  db.getEvent(eventId, callback);
}

/*
 Get the survey associated with the passed event id

 Parameters:
   eventId: the event id
   callback: a function to callback on with signature:
     err: filled in if something bad happened
     survey: the found survey if we have one, otherwise undefined
 */
exports.getSurveyByEventId = function(eventId, callback) {
  
  var cacheKey = 'eventManager.getSurvyeByEventId.' + eventId;
  
  async.waterfall([
    function(cb) {
      cache.getFromCache(cacheKey, function(result) {
        cb(null, result);
      });
    },
    function(survey, cb) {
      if (!survey) {

        db.getSurveyByEventId(eventId, function(err, result) {
          
          if (!err && result) {
            
            var options = {
              object: result,
              key: cacheKey,
              ttl: 5
            }
            
            cache.addToCache(options, function() {
              cb(null, result);
            });
          } else {
            cb(err, result);
          }
        });
      } else {
       cb(null, survey);
      }
    }
  ], function(err, survey) {
    callback(err, survey);    
  })
}

/**
 Inserts a survey for an event into the database

 Parameters:
 survey - the survey data
 callback - a function to call when the saving is done, with signature:
 err - filled in if something bad happened
 newSurvey - the inserted survey
 */
exports.insertSurvey = function(survey, callback) {
  db.insertSurvey(survey, callback);
}

/**
 Update an existing survey in the usergrid database

 Parameters:
 survey - the survey data to update.  The uuid should be filled in already.
 callback - the callback function, with this signature:
 err - description of any errors that occurred
 createdSurvey - the new survey that was update
 */
exports.updateSurvey = function(survey, callback) {
  db.updateSurvey(survey, callback);
}

/*
 Returns the total number of checkins and registrations for an event

 Parameters:
   eventId: the event id
   callback: callback with parameters:
     err: filled in if something bad happened
       result: object containing results:
       eg. { checkins: int, registered: int }
 */
exports.getEventUsersCounts = function(eventId, callback) {

  var cacheKey = 'eventManager.getEventUsersCounts.' + eventId;

  async.waterfall([
    function(cb) {
      cache.getFromCache(cacheKey, function(result) {
        cb(null, result);
      });
    },
    function(survey, cb) {
      if (!survey) {

        db.getEventUsersCounts(eventId, function(err, result) {

          if (!err) {

            var options = {
              object: result,
              key: cacheKey,
              ttl: 5
            }
            cache.addToCache(options, function() {
              cb(null, result);
            });
          } else {
            cb(err);
          }
        });
      } else {
        cb(null, survey);
      }
    }
  ], function(err, survey) {
    callback(err, survey);
  })
}

/*
 Gets the total contaggs at/from an event

 Parameters:
   eventId: the event id
   callback: function with sig:
     err: filled in if something bad happened
     result: object with values: { contaggs: int }
     
     DELETE THIS! It's obsolete since the devices will not be 
     adding the event field to the contagg row.
 */

/*
exports.getEventTotalContaggs = function(eventId, callback) {
  db.getEventTotalContaggs(eventId, callback);
}
*/

exports.getEventSurveyAnswers = function(surveyId, callback) {

  var cacheKey = 'eventManager.getEventSurveyAnswers.' + surveyId;

  async.waterfall([
    function(cb) {
      cache.getFromCache(cacheKey, function(result) {
        cb(null, result);
      });
    },
    function(survey, cb) {
      if (!survey) {

        db.getEventSurveyAnswers(surveyId, function(err, result) {

          if (!err) {

            var options = {
              object: result,
              key: cacheKey,
              ttl: 5
            }
            cache.addToCache(options, function() {
              cb(null, result);
            });
          } else {
            cb(err);
          }
        });
      } else {
        cb(null, survey);
      }
    }
  ], function(err, survey) {
    callback(err, survey);
  })
}

/**
 * Grabs the usergrid contagg objects that were created between the passed dates
 * @param startDate - the start date
 * @param endDate - the end date
 * @param callback - function with sig
 *  err - you know what this is
 *  contaggs - array of *usergrid* contagg objects - not normal objects!
 */
exports.getContaggsCreatedBetweenStartAndEndDates = function(startDate, endDate, callback) {
  db.getContaggsCreatedBetweenStartAndEndDates(startDate, endDate, callback);
}

/**
 * Get events counts based on the options.
 * @param options - TBD
 * @param callback - function with signature:
 *  err - filled in if there was bad juju
 *  events - an array of results based on your options
 */
exports.getEventCounts = function(options, callback) {
  db.getEventCounts(options, callback);
}