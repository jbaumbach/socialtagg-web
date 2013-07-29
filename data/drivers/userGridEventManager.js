/**
 * User: jbaumbach
 * Date: 7/14/13
 * Time: 6:21 PM
 */


var util = require('util')
  , client = require('./../connectors/userGrid')
  , globalFunctions = require('../../common/globalfunctions')
  , application = require('../../common/application')
  , Event = require('../../models/Event')
  , thisModule = this
  ;

/**
 * Takes an event from usergrid and returns a SocialTagg Event
 * 
 * @param userGridEvent
 */
exports.eventFromUserGridEvent = function(userGridEvent) {

  return new Event({
    uuid: userGridEvent.get('uuid'),
    owner: userGridEvent.get('owner'),
    name: userGridEvent.get('event_name'),
    description: userGridEvent.get('description'),
    modified: userGridEvent.get('modified'),
    created: userGridEvent.get('created'),
    address: userGridEvent.get('address'),
    timezoneOffset: userGridEvent.get('timezone_offset'),
    startDate: userGridEvent.get('start_date'),
    checkinPeriodStartTimeMins: userGridEvent.get('checkin_period_start_mins'),
    durationHours: userGridEvent.get('duration_hours'),
    locationLat: userGridEvent.get('locationLat'),
    locationLon: userGridEvent.get('locationLon'),
    website: userGridEvent.get('website'),
    inactiveDate: userGridEvent.get('inactive_date')
  });
};

/**
 Get a minimal object for getting an event from userGrid
 
 Parameters:
 eventId - the event id
 
 Returns
 A userGrid event suitable for querying the DB.
 */
function userGridEventFromId(eventId) {
  return {
    type: 'events-sts',
    uuid: eventId
  };
}
/**
 Generate the "options" object that the usergrid component uses when
 inserting or updating data in the database.
 
 Parameters:
 postedEvent - the data fields containing the data.  (Hint: from
         the Angular model on the events page)
 isInserting - true to add a unique "name" field
 
 returns: the usergrid object.
 
 */
function userGridEventFromData(postedEvent) {
  
  var result = {
    
    type: 'events-sts',

    //
    // Note: the property names on the left here are the fields in the
    // database.  They must match the '.get(name)' names in the
    // 'eventFromUserGridEvent()' function.
    // The names on the right side must match the properties of the
    // event model in the Angular model (ng-events.js).
    //

    owner: postedEvent.owner,
    event_name: postedEvent.name,
    description: postedEvent.description,
    address: postedEvent.address,
    timzone_offset: postedEvent.timezoneOffset,
    start_date: postedEvent.startDate,
    checkin_period_start_mins: postedEvent.checkinPeriodStartTimeMins,
    duration_hours: postedEvent.durationHours,
    website: postedEvent.website,
    inactive_date: postedEvent.inactiveDate 

  };

  if (!postedEvent.uuid) {

    //
    // Must create a unique value for 'name' according to the UG docs:
    // http://apigee.com/docs/usergrid/content/data-model
    //
    // It has some restrictions as far as allowed characters, which apparently
    // // are undocumented.  Let's use MD5 to be safe.
    //
    result.name = 'name' + globalFunctions.md5Encode(postedEvent.owner + postedEvent.name + new Date());
    
  } else {

    result.uuid = postedEvent.uuid;

    //
    // Get the entity from usergrid during the "CreateEntity()" call, rather
    // than generating an error.  This allows updates on the object.
    //
    // result.getOnExist = true;

  }

  return result;

}

/**
 Insert an event
 
 Parameters:
 event - the event data to insert.  The owner id should be filled in already.
        See the Angular form data and model for data object field names, they're
        slightly different than the property names.
 callback - the callback function, with this signature:
   err - description of any errors that occurred
   createdEvent - the new event that was created (has the new event uuid)
 */
exports.insertEvent = function(event, callback) {
  var result = undefined;
  
  var options = userGridEventFromData(event);
  
  client().createEntity(options, function(err, newEvent) {
    
    var result;
    
    if (!err) {

      result = thisModule.eventFromUserGridEvent(newEvent);
    }
    
    callback(err, result);
    
  });
};

/**
 Update an existing event in the usergrid database
 
 Parameters:
   event - the event data to update.  The owner id should be filled in already.
   callback - the callback function, with this signature:
     err - description of any errors that occurred
     createdEvent - the new event that was update
   */
exports.updateEvent = function(event, callback) {
  
  // implement an endpoint, and test this!!! 
  
  //
  // Single point of exit
  //
  function done(err, result) {
    callback(err, result);
  }
  
  var updatedEvent = userGridEventFromData(event);
  var options = userGridEventFromData(event);

  console.log('data put from Angular: ' + util.inspect(updatedEvent));

  client().createEntity(options, function(err, existingEvent) {
    
    var result;
    
    if (!err) {
      //
      // We simply got the existing usergrid object from the db.  Let's
      // set the properties and save it.
      //
      existingEvent.set(updatedEvent);
      
      console.log('about to put to UG: ' + util.inspect(updatedEvent));
      
      existingEvent.save(function(err) {
        done(err, result);
      });
      
    }
    
    done(err, result);
  });
  
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
  
  var options = userGridEventFromId(eventId);
  
  console.log('calling UG with: ' + util.inspect(options));
  
  client().getEntity(options, function(err, existingEvent) {
    var result;
    
    if (!err) {
      result = thisModule.eventFromUserGridEvent(existingEvent);
    }
    
    callback(err, result);
    
  });
  
}

/**
 Delete an event from the database
 
 Parameters:
    eventId - the event id
    callback - called when done, with this signature:
      err - filled in if something went wrong
 */
exports.deleteEvent = function(eventId, callback) {

  var options = userGridEventFromData({
    uuid: eventId
  });

  client().createEntity(options, function(err, existingEvent) {

    if (!err) {
      
      existingEvent.destroy(function(err) {
        callback(err);
      });
      
    } else {

      callback(err);
    }
  });
}