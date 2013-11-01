/**
 * User: jbaumbach
 * Date: 7/22/13
 * Time: 9:59 AM
 */



var util = require('util')
  , globalFunctions = require('../common/globalfunctions')
  , application = require('../common/application')
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
  this.startDate = values.startDate || '';
  this.startTime = values.startTime || '';
  this.endDate = values.endDate || '';
  this.endTime = values.endTime || '';
  this.timezoneOffset = values.timezoneOffset || '';
  this.checkinPeriodStartTimeMins = values.checkinPeriodStartTimeMins || '';
  this.locationLat = values.locationLat || '';
  this.locationLon = values.locationLon || '';
  this.website = values.website || '';
  this.inactiveInd = values.inactiveInd || '';
  this.startDateTimeUtc = values.startDateTimeUtc || 0;
  this.endDateTimeUtc = values.endDateTimeUtc || 0;
  
  // Additional initialization
  
  // Note: we are setting these members here because prototype
  // properties don't appear to be serialized by Express when 
  // sending the object back to the client.
  if (this.uuid) {

    // todo: update this when we have a urlmanager

    this.path = '/events/' + this.uuid;
    this.analyticsPath = '/events/' + this.uuid + '/analytics';
    this.checkInPage = '/events/' + this.uuid + '/checkinpage';
    
  } else {
    
    this.path = '#';
    this.analyticsPath = '#';
    this.printerFriendlyPath = '#';
  }
  
  this.hashtag = globalFunctions.toHashtag(this.name);
  
};

//
// The QR code is derived; build it on-demand.
//
Object.defineProperty(Event.prototype, "qrCodeUrl", {
  get: function() {
    //
    // The mobile apps only know what the production server is
    //
    var fullProductionPath = application.globalVariables.productionSecureProtocol + '://' + 
      application.globalVariables.productionServerPath +
      this.path;
    
    return globalFunctions.qrCodeUrl(fullProductionPath, { size: 500 });
  }
});


//
// Export our class
//
module.exports = Event;