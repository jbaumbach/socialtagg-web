/**
 * User: jbaumbach
 * Date: 7/22/13
 * Time: 9:59 AM
 */



var util = require('util')
  , globalFunctions = require('../common/globalfunctions')
;

var Event = function(values) {
  values = values || {};
  
  this.uuid = values.uuid || '';
  this.owner = values.owner || '';
  this.name = values.name || '';
  this.description = values.description || '';
  this.modified = values.modified || '';
  this.created = values.created || '';
  this.address = values.address || '';
  this.timezoneOffset = values.timezoneOffset || '';
  this.startDate = values.startDate || '';
  this.checkinPeriodStartTimeMins = values.checkinPeriodStartTimeMins || '';
  this.durationHours = values.durationHours || '';
  this.locationLat = values.locationLat || '';
  this.locationLon = values.locationLon || '';
  this.website = values.website || '';
  this.inactiveDate = values.inactiveDate || '';

  
  // Additional initialization
  
  // Note: we are setting this member here because prototype
  // properties don't appear to be serialized by Express when 
  // sending the object back to the client.
  if (this.uuid) {

    // todo: update this when we have a urlmanager

    this.path = '/events/' + this.uuid;
    
  } else {
    
    this.path = '#';
  }
};

//
// Export our class
//
module.exports = Event;