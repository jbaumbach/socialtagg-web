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
            result.cacheKey = cacheKey;
            cache.addObjectToCache(result, function() {
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

            result.cacheKey = cacheKey;
            cache.addObjectToCache(result, function() {
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

  
  
  
  
  
  
  // db.getEventUsersCounts(eventId, callback);
}