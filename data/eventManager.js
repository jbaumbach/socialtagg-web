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