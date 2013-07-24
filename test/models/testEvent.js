/**
 * User: jbaumbach
 * Date: 7/22/13
 * Time: 10:24 AM
 */

var assert = require('assert')
  , Event = require('../../models/Event')
  , User = require('../../models/User')
;

describe('Event model', function() {
  
  it('should have a working constructor', function() {
    
    var initData = {
      id: 'blah',
      owner: '123456',
      name: 'my event',
      description: 'my sample description',
      modified: new Date(),
      created: 1360536391023,      // Sun Feb 10 2013
      startDate: new Date(),
      durationHours: 55,
      locationLat: -34.4534,
      locationLon: 123.2323,
      website: 'http://www.holycrap.com',
      inactiveDate: new Date()
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
  
});