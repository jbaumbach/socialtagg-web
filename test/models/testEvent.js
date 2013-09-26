/**
 * User: jbaumbach
 * Date: 7/22/13
 * Time: 10:24 AM
 */

var assert = require('assert')
  , Event = require('../../models/Event')
  , User = require('../../models/User')
  , application = require('../../common/application')
;

describe('Event model', function() {
  
  it('should have a working constructor', function() {
    
    var initData = {
      uuid: 'blah',
      owner: '123456',
      name: 'my event',
      description: 'my sample description',
      modified: new Date(),
      created: 1360536391023,      // Sun Feb 10 2013
      address: '1234 Tattoine St.',
      startDate: '2/2/2121',
      startTime: '1:30 PM',
      endDate: '2/3/2121',
      endTime: '4:30 PM',
      timezoneOffset: -8, // PST
      checkinPeriodStartTimeMins: 15,
      locationLat: -34.4534,
      locationLon: 123.2323,
      website: 'http://www.holycrap.com',
      inactiveInd: true
    };
    
    var testEvent = new Event(initData);

    //
    // Get us an array of keys containing the names of all the original properties
    //
    var propertiesTested = 0;
    var originalProps = Object.keys(initData);

    originalProps.forEach(function(propName) {

      var propValue = initData[propName];
      var actualValue = eval("testEvent." + propName);

      assert.equal(propValue, actualValue, 'didn\'t get back our property for: ' + propName);
      propertiesTested++;
    });

    assert.equal(Object.keys(initData).length, propertiesTested, 'did\'t test all the properties');
    
  });
  
  it('should generate a hashtag properly', function() {
    var n = 'This is my events name 23';
    var h = 'thisismyeventsname23';
    
    var initData = {
      name: h
    };
    
    var e = new Event(initData);
    var r = e.hashtag;
    
    assert.equal(r, h, 'didn\'t get right hashtag');
    
  });
  
  it('should generate a production qr code', function() {
    var initData = {
      uuid: 'yoda'
    }

    application.globalVariables.productionServerPath = 'www.socialtagg.com';
    application.globalVariables.productionSecureProtocol = 'https';

    var event = new Event(initData);
    var e = 'http://chart.apis.google.com/chart?cht=qr&chs=500x500&chl=https%3A%2F%2Fwww.socialtagg.com%2Fevents%2Fyoda';
    
    var r = event.qrCodeUrl;
    
    assert.equal(r, e, 'didn\'t get right url back');
  })
});