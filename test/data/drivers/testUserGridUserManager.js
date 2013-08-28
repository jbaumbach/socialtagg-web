/**
 * User: jbaumbach
 * Date: 8/14/13
 * Time: 12:07 AM
 */


var userGridUserManager = require('../../../data/drivers/userGridUserManager')
  , assert = require('assert')
  , util = require('util')
;


var fb = {
  uuid: '420f013a-03f4-11e3-851f-a93a57d20d81',
  type: 'user',
  name: 'John Baumbach',
  created: 1376383336643,
  modified: 1376462315727,
  username: 'fb_1045040967',
  activated: true,
  picture: 'http://graph.facebook.com/1045040967/picture',
  facebook:
  { id: '1045040967',
    name: 'John Baumbach',
    first_name: 'John',
    last_name: 'Baumbach',
    link: 'https://www.facebook.com/john.baumbach',
    username: 'john.baumbach',
    hometown: { id: '106126549417653', name: 'Westlake Village, California' },
    location: { id: '109683405724572', name: 'Santa Monica, California' },
    gender: 'male',
    email: 'john.j.baumbach@gmail.com',
    timezone: -7,
    locale: 'en_US',
    verified: true,
    updated_time: '2013-02-26T06:45:37+0000'
  }
}

describe('userGridUserManager', function() {

  it('should get a user from a FB object', function() {
    
    var r = userGridUserManager.userFromFBLoginUser(fb);
    
    assert.equal(r.id, fb.uuid, 'didn\'t convert id');
    
    //console.log('got username: ' + r.userName);
    //console.log('have email: ' + fb.facebook.email);
    
    assert.equal(r.userName, fb.facebook.email, 'didn\'t convert username/email');
    assert.equal(r.email, fb.facebook.email, 'didn\'t convert email');
    
  })
  
  it('should be able to tell a new FB login', function() {
    
    var r = userGridUserManager.isFirstFbLogin(fb);
    assert.ok(r, 'couldn\'t tell first fb login');
  })

  it('should be able to tell a non-new FB login', function() {

    var fbu = { username: 'blah@blah.com' };
    var r = userGridUserManager.isFirstFbLogin(fbu);
    assert.ok(!r, 'couldn\'t tell second or later fb login');
  })

});
