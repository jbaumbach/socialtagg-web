/**
 * User: jbaumbach
 * Date: 7/14/13
 * Time: 6:20 PM
 */

var
  db = require('./drivers/userGridEventManager')
  , globalFunctions = require('../common/globalfunctions')
  , thisModule = this
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