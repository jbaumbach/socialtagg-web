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
  , async = require('async')
  , userGridUtilities = require('./userGridUtilities')
  , thisModule = this
  ;

/**
 * Convert a UserGrid row from /event_users collection into an object
 * @param {object} the usergrid data row object
 * @returns {{uuid: (*|Array|null|Mixed|stats.StatsGroup.get|String), event_uuid: (*|Array|null|Mixed|stats.StatsGroup.get|String), user_uuid: (*|Array|null|Mixed|stats.StatsGroup.get|String), checkin_date: (*|Array|null|Mixed|stats.StatsGroup.get|String), registration_date: (*|Array|null|Mixed|stats.StatsGroup.get|String), notes: (*|Array|null|Mixed|stats.StatsGroup.get|String)}}
 */
exports.eventUserFromUserGridEventUser = function(ugEventUser) {
  
  var result = {
    uuid: ugEventUser.get('uuid'),
    eventUuid: ugEventUser.get('event_uuid'),
    userUuid: ugEventUser.get('user_uuid'),
    checkinDate: ugEventUser.get('checkin_date'),
    registrationDate: ugEventUser.get('registration_date'),
    notes: ugEventUser.get('notes')
  }
  
  return result;
}

exports.surveyAnswersFromUserGridSurveyAnswers = function(ugSurveyAnswers) {
  var result = {
    user: ugSurveyAnswers.get('user_uuid'),
    created: ugSurveyAnswers.get('created'),
    answers: ugSurveyAnswers.get('answers')
  }

  return result;
}

/**
 * Takes an event from usergrid and returns a SocialTagg Event
 * 
 * @param userGridEvent
 */
exports.eventFromUserGridEvent = function(userGridEvent) {

  var constructionData = {
    uuid: userGridEvent.get('uuid'),
    owner: userGridEvent.get('owner'),
    name: userGridEvent.get('event_name'),
    description: userGridEvent.get('description'),
    modified: userGridEvent.get('modified'),
    created: userGridEvent.get('created'),
    address: userGridEvent.get('address'),
    timezoneOffset: userGridEvent.get('timezone_offset'),
    checkinPeriodStartTimeMins: userGridEvent.get('checkin_period_start_mins'),
    locationLat: userGridEvent.get('locationLat'),
    locationLon: userGridEvent.get('locationLon'),
    website: userGridEvent.get('website'),
    inactiveInd: userGridEvent.get('inactive_ind')
  }

  //
  // Break down dates to human digestible forms if we can
  //
  var sd = userGridEvent.get('start_date');
  constructionData.startDateTimeUtc = sd;
  
  if (sd && constructionData.timezoneOffset) {
    
    var parts = application.getContituentDateParts(sd, constructionData.timezoneOffset);
    constructionData.startDate = parts.date;
    constructionData.startTime = parts.time;
    
  } else {
    console.log('(warning) eventFromUserGridEvent: no data to build start date');
  }
  
  var ed = userGridEvent.get('end_date');
  constructionData.endDateTimeUtc = ed;
  
  if (ed && constructionData.timezoneOffset) {
    
    var parts = application.getContituentDateParts(ed, constructionData.timezoneOffset);
    constructionData.endDate = parts.date;
    constructionData.endTime = parts.time;
    
  } else {
    console.log('(warning) eventFromUserGridEvent: no data to build end date');
  }
  
  return new Event(constructionData);
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
    start_date: postedEvent.startDate,
    end_date: postedEvent.endDate,
    timezone_offset: postedEvent.timezoneOffset,
    checkin_period_start_mins: postedEvent.checkinPeriodStartTimeMins,
    website: postedEvent.website,
    inactive_ind: postedEvent.inactiveInd 

  };

  if (!postedEvent.uuid) {

    //
    // Must create a unique value for 'name' according to the UG docs:
    // http://apigee.com/docs/usergrid/content/data-model
    //
    // It has some restrictions as far as allowed characters, which apparently
    // are undocumented.  Let's use MD5 to be safe.
    //
    result.name = 'name' + globalFunctions.md5Encode(postedEvent.owner + postedEvent.name + new Date());
    
  } else {

    result.uuid = postedEvent.uuid;

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
      
    } else {
    
      done(err, result);
    }
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

/*
  Get the survey associated with the passed event id
  
  Parameters:
    eventId: the event id
    callback: a function to callback on with signature:
      err: filled in if something bad happened
      survey: the found survey if we have one, otherwise undefined
 */
exports.getSurveyByEventId = function(eventId, callback) {
  
  var options = {
    type: 'surveys',
    qs: {
      ql: util.format('select * where event_uuid = %s', eventId)
    }
  }
  
  client().createCollection(options, function(err, existingSurveys) {
    if (err) {
      callback(err, null);
    } else {
      if (existingSurveys.hasNextEntity()) {
        
        var userGridResultSurvey = existingSurveys.getNextEntity();
        var result = thisModule.surveyFromUserGridSurvey(userGridResultSurvey);
        
        callback(false, result);
        
      } else {
        callback(false, null);
      }
    }
  })
  
}

/*
  Get a usergrid 'options' object from the passed survey data
  
  Parameters:
    postedSurvey: the survey data
    
 */
exports.userGridSurveyFromData = function (postedSurvey) {
  var result = {
    
    type: 'surveys',

    //
    // Note: the property names on the left here are the fields in the
    // database.  They must match the '.get(name)' names in the
    // 'surveyFromUserGridSurvey()' function.
    // The names on the right side must match the properties of the
    // event model in the Angular model (ng-events.js).
    //

    event_uuid: postedSurvey.eventId,
    is_anonymous: true,
    when_to_show_type: postedSurvey.whenToShowType,
    when_to_show_mins: postedSurvey.whentoShowMins,
    inactive_ind: postedSurvey.inactiveInd,
    questions: postedSurvey.questions
    
  }
    
  if (!postedSurvey.uuid) {
  
    //
    // Must create a unique value for 'name' according to the UG docs:
    // http://apigee.com/docs/usergrid/content/data-model
    //
    // It has some restrictions as far as allowed characters, which apparently
    // // are undocumented.  Let's use MD5 to be safe.
    //
    result.name = 'surv' + globalFunctions.md5Encode(postedSurvey.eventId + new Date());
  
  } else {
    
    result.uuid = postedSurvey.uuid; 
  }
 
  return result;
}

/*
  Returns a Survey object from the passed usergrid object
 */
exports.surveyFromUserGridSurvey = function (ugSurvey) {
  var result = {
    uuid: ugSurvey.get('uuid'),
    eventId: ugSurvey.get('event_uuid'),
    isAnonymous: ugSurvey.get('is_anonymous'),
    whenToShowType: ugSurvey.get('when_to_show_type'),
    whentoShowMins: ugSurvey.get('when_to_show_mins'),
    inactiveInd: ugSurvey.get('inactive_ind'),
    questions: ugSurvey.get('questions')
  };
  
  return result;
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
  
  var result = undefined;

  var options = thisModule.userGridSurveyFromData(survey);

  client().createEntity(options, function(err, newSurvey) {

    var result;

    if (!err) {

      result = thisModule.surveyFromUserGridSurvey(newSurvey);
    }

    callback(err, result);

  });
  
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
  //
  // Single point of exit
  //
  function done(err, result) {
    callback(err, result);
  }

  var updatedSurvey = thisModule.userGridSurveyFromData(survey);
  var options = thisModule.userGridSurveyFromData(survey);

  console.log('data put from Angular: ' + util.inspect(updatedSurvey));

  client().createEntity(options, function(err, existingSurvey) {

    var result;

    if (!err) {
      //
      // We simply got the existing usergrid object from the db.  Let's
      // set the properties and save it.
      //
      existingSurvey.set(updatedSurvey);

      console.log('about to put to UG: ' + util.inspect(updatedSurvey));

      existingSurvey.save(function(err) {
        done(err, result);
      });

    } else {

      done(err, result);
    }
  });
  
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

  var options = {
    queryOptions: {
      type: 'event_users',
      qs: {
        // Note: you have to use '*' - specifying individual columns causes '.hasNextEntity()' on the 
        // collection to fail
        ql: util.format('select * where event_uuid = %s', eventId)
      }
    },

    aggregator: function (eventUserRow) {
      if (eventUserRow.get('registration_date')) {
        result.registered++;
      }

      if (eventUserRow.get('checkin_date')) {
        result.checkins++;
      }
    }
  }

  var result = {
    registered: 0,
    checkins: 0
  }

  userGridUtilities.counterFunction(options, function(err) {
    callback(err, result);
  });
}

/*
  Gets the total contaggs at/from an event
  
  Parameters:
    eventId: the event id
    callback: function with sig:
      err: filled in if something bad happened
      result: object with values: { contaggs: int }
 */
exports.getEventTotalContaggs = function(eventId, callback) {

  var options = {
    queryOptions: {
      type: 'contaggs',
      qs: {
        // Note: you have to use '*' - specifying individual columns causes '.hasNextEntity()' on the 
        // collection to fail
        ql: util.format('select * where event_uuid = %s', eventId)
      }
    },

    aggregator: function (eventUserRow) {
      if (eventUserRow.get('event_uuid')) {
        result.contaggs++;
      }
    }
  }

  var result = {
    contaggs: 0
  }

  userGridUtilities.counterFunction(options, function(err) {
    callback(err, result);
  });
}

// todo: how is this working??? is this working???
exports.getEventCompaniesRepresented = function(eventId, callback) {
  
  var options = {
    queryOptions: {
      type: 'contaggs',
      qs: {
        // Note: you have to use '*' - specifying individual columns causes '.hasNextEntity()' on the 
        // collection to fail
        ql: util.format('select * where event_uuid = %s', eventId)
      }
    },

    aggregator: function (eventUserRow, cb) {
      
      result.contaggs++;
      
      console.log('calling cb!');
      cb();
    }
  }

  var result = {
    contaggs: 0
  }

  userGridUtilities.counterFunction(options, function(err) {
    console.log('done w/gecr, boom');
    callback(err, result);
  });
  
}

exports.getEventSurveyAnswers = function(surveyId, callback) {

  var options = {
    queryOptions: {
      type: 'survey_answers',
      qs: {
        // Note: you have to use '*' - specifying individual columns causes '.hasNextEntity()' on the 
        // collection to fail
        ql: util.format('select * where survey_uuid = %s', surveyId)
      }
    },

    aggregator: function (surveyAnswersRecord, cb) {

      var userResult = thisModule.surveyAnswersFromUserGridSurveyAnswers(surveyAnswersRecord);
      result.responses.push(userResult);
      cb();
    }
  }

  var result = {
    responses: []
  }

  userGridUtilities.counterFunction(options, function(err) {
    console.log('done w/gecr, boom');
    callback(err, result);
  });

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
  
  var options = {
    queryOptions: {
      type: 'contaggs',
      qs: {
        // Note: you have to use '*' - specifying individual columns causes '.hasNextEntity()' on the 
        // collection to fail
        ql: util.format('select * where created > %s and created < %s', startDate, endDate)
      }
    },

    aggregator: function (record, cb) {

      //
      // Note: we're just going to push the UG objects, just in case we want to do some updatin' later
      //
      result.push(record);
      cb();
    }
  }

  var result = []

  console.log('gccbsaed: ' + util.inspect(options));
  
  userGridUtilities.counterFunction(options, function(err) {
    callback(err, result);
  });


}