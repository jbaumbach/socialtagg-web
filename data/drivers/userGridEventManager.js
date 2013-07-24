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
function eventFromUserGridEvent(userGridEvent) {

  return new Event({
    id: userGridEvent.get('uuid'),
    owner: userGridEvent.get('owner'),
    name: userGridEvent.get('event_name'),
    description: userGridEvent.get('description'),
    modified: globalFunctions.convertDate(userGridEvent.get('modified'), 'n/a'),
    created: globalFunctions.convertDate(userGridEvent.get('created'), 'n/a'),
    startDate: userGridEvent.get('startDate'),
    durationHours: userGridEvent.get('durationHours'),
    locationLat: userGridEvent.get('locationLat'),
    locationLon: userGridEvent.get('locationLon'),
    website: userGridEvent.get('website'),
    inactiveDate: userGridEvent.get('inactiveDate')
  });
};

/**
 Generate the "options" object that the usergrid component uses when
 inserting or updating data in the database.
 
 * @param postedEvent - the data fields containing the data.  (Hint: from
 *        the Angular model on the events page)
 * @param isInserting - true to add a unique "name" field
 * @returns: the usergrid object. 
 */
function userGridEventFromData(postedEvent) {
  
  var result = {
    
    type: 'events-sts',

    //
    // Note: the property names on the left here are the fields in the
    // database.  They must match the '.get(name)' names in the
    // 'eventFromUserGridEvent()' function.
    //

    owner: postedEvent.owner,
    event_name: postedEvent.name,
    description: postedEvent.description,
    address: postedEvent.address,
    startDate: postedEvent.date,
    durationHours: postedEvent.hours,
    website: postedEvent.website

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
    result.getOnExist = true;

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
  
  console.log('(info) userGridEventManager.insertEvent: raw from form = ' + util.inspect(event));
  
  var options = userGridEventFromData(event);
  
  console.log('(info) userGridEventManager.insertEvent: going in = ' + util.inspect(options));
  
  client().createEntity(options, function(err, newEvent) {
    
    console.log('(info) userGridEventManager.insertEvent: err? = ' + err);

    var result;
    
    if (!err) {
      result = eventFromUserGridEvent(newEvent);
      
      console.log('(info) userGridEventManager.insertEvent: built = ' + util.inspect(result));
    }
    
    callback(err, result);
    
  });
};

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
  
  // todo: test this!!! 
  
  //
  // Single point of exit
  //
  function done(err, result) {
    callback(err, result);
  }
  
  var options = userGridEventFromData(event);
  
  client().createEntity(options, function(err, existingEvent) {
    
    var result;
    
    if (!err) {
      //
      // We simply got the existing usergrid object from the db.  Let's
      // set the properties and save it.
      //
      existingEvent.set(options);
      
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
  
  // todo: test this!!!
  
  var options = userGridEventFromData({
    uuid: eventId
  });
  
  client().createEntity(options, function(err, existingEvent) {
    var result;
    
    if (!err) {
      result = eventFromUserGridEvent(existingEvent);
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

  // todo: test this!!!

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