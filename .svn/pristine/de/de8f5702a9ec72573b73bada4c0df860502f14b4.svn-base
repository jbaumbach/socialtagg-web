/**
 * User: jbaumbach
 * Date: 2/16/13
 * Time: 4:08 PM
 */

//
// There shouldn't be a whole log of app logic in the dumb classes, but
// we'll want to test that some stuff like properties and constructors work.
//
var assert = require('assert');

var User = require('../../models/User');

describe('User model', function() {

  //
  // Test the constructor.  
  //
  it('should have a working constructor', function() {
    //
    // The assumption is that the values here are the EXACT SAME NAMES as the
    // properties of the "User" object.  If you have different ones, you'll
    // need to manually test them separately.
    //
    var initData = { 
      id: 'blah', 
      name: 'fred', 
      email: 'hello@there.com',
      address: '1234 hello St.',
      phone: '(805) 123-4566',
      password: 'mypass',
      pictureUrl: 'http://mysite.com/mypic.gif',
      pictureDataBytes: 'afasfaffas',
      pictureMimeType: 'image/gif',
      createDate: 1360536391023,      // Sun Feb 10 2013
      website: 'http://socialtagg.com',
      bio: 'Amateur hacker',
      company: 'SocialTagg',
      title: 'Chief Hacking Officer',
      twitter: 'neverusedtwitteritslame'
    };
    
    var testUser = new User(initData);
    
    //
    // Wow, great site.  Interview questions galore: http://book.mixu.net/index.html
    //
    
    //
    // Get us an array of keys containing the names of all the original properties
    //
    var propertiesTested = 0;
    var originalProps = Object.keys(initData);
    
    originalProps.forEach(function(propName) {
      
      var propValue = initData[propName];
      var actualValue = eval("testUser." + propName);
      
      assert.equal(propValue, actualValue, 'didn\'t get back our property for ' + propName);
      propertiesTested++;
    });
    
    assert.equal(Object.keys(initData).length, propertiesTested, 'did\'t test all the properties');
    
    //
    // If we get standardized formatting for dates, replace the constant with the function
    // call value below.
    //
    var createDateStr = 'Sun Feb 10 2013'; 
    assert.equal(createDateStr, testUser.createDateStr, 'create date string not correct');
  });
  
  it('should update createDateStr when createDate is updated', function() {
    var origCreateDate = new Date();
    var origCreateDateStr = origCreateDate.toDateString();
    
    var testUser = new User( { createDate: origCreateDate } );
    
    assert.equal(origCreateDateStr, testUser.createDateStr, 'didn\'t get right original date set in constructor');
    
    testUser.createDate = 1360536391023;      // Sun Feb 10 2013

    //
    // If we get standardized formatting for dates, replace the constant with the function
    // call value below.
    //
    var newDateStr = 'Sun Feb 10 2013';

    assert.equal(newDateStr, testUser.createDateStr, 'didn\'t get new date string back');
    
  });
  
});
