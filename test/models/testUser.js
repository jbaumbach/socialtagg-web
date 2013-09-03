/**
 * User: jbaumbach
 * Date: 2/16/13
 * Time: 4:08 PM
 */

//
// There shouldn't be a whole log of app logic in the dumb classes, but
// we'll want to test that some stuff like properties and constructors work.
//
var assert = require('assert')
  , User = require('../../models/User')
  ;

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
      firstName: 'steve',
      lastName: 'jones',
      email: 'hello@there.com',
      address: '1234 hello St.',
      phone: '(805) 123-4566',
      //password: 'mypass', // 9/2/2013 JB: Not supported any longer
      pictureUrl: 'http://mysite.com/mypic.gif',
      pictureDataBytes: 'afasfaffas',
      pictureMimeType: 'image/gif',
      createDate: 1360536391023,      // Sun Feb 10 2013
      website: 'http://socialtagg.com',
      bio: 'Amateur hacker',
      company: 'SocialTagg',
      title: 'Chief Hacking Officer',
      twitter: 'neverusedtwitteritslame',
      avatarId: '01234abcde'
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
      
      assert.equal(propValue, actualValue, 'didn\'t get back our property for: ' + propName);
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
  
  it('should get full name when first and last are set in constructor', function() {
    var testUser = new User( { firstName: 'Han', lastName: 'Solo'} );
    assert.equal(testUser.name, 'Han Solo', 'didn\'t get "Han Solo" back');
  });
  
  it('should get full name when first and last are set by property', function() {
    var testUser = new User();
    testUser.firstName = 'Boba';
    testUser.lastName = 'Fett';
    assert.equal(testUser.name, 'Boba Fett', 'didn\'t get "Boba Fett" back');
  });
  
  it('should be able to override first and last names explicitly', function() {
    var testUser = new User( { firstName: 'Luke', lastName: 'Skywalker'} );
    testUser.name = 'Darth Vader';
    assert.equal(testUser.name, 'Darth Vader', 'didn\'t get "Darth Vader" back');
  }); 
  
  it('should ignore empty string as full name and return first and last names as full name', function() {
    var testUser = new User();
    testUser.name = '';
    testUser.firstName = 'Boba';
    testUser.lastName = 'Fett';
    assert.equal(testUser.name, 'Boba Fett', 'didn\'t get "Boba Fett" back');
  });
  
  it('should return a cache key', function() {
    var theId = 'yoda';
    var u = new User( { id: theId } );
    var k = 'User' + theId;
    
    var r = u.cacheKey;
    
    assert.equal(r, k, 'didn\'t get right cache key');
  })
  
  it('should statically get a cache key', function() {
    var theId = 'yoda';
    var k = 'User' + theId;
    
    var r = User.cacheKey(theId);
    
    assert.equal(r, k, 'didn\'t get a good static cache key');
    
  })
  
});
