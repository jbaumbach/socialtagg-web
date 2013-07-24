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
  
  this.id = values.id || '';
  this.owner = values.owner || '';
  this.name = values.name || '';
  this.description = values.description || '';
  this.modified = values.modified || '';
  this.created = values.created || '';
  this.startDate = values.startDate || '';
  this.durationHours = values.durationHours || '';
  this.locationLat = values.locationLat || '';
  this.locationLon = values.locationLon || '';
  this.website = values.website || '';
  this.inactiveDate = values.inactiveDate || '';
}


//
// Export our class
//
module.exports = Event;