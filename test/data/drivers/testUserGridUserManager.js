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

  this.timeout(5000);

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

  //
  // Some test data
  //
  var emailToRegister = 'blah2@blah.com';
  var valcode = '01234abcde';
  var newValCode = 'fghjk45678';
  var origReg = { email: emailToRegister, validationCode: valcode};

  //
  // Note: this test is more effective if the UG record is deleted manually first
  // select * where email = 'blah2@blah.com'
  //
  it('should insert a UG registration', function(done) {
    
    userGridUserManager.upsertUserRegistration(origReg, function(err, newReg) {
      assert.ok(!err, 'weird, had error');
      
      assert.equal(newReg.email, emailToRegister, 'didn\'t get right email back');
      assert.equal(newReg.validationCode, valcode, 'didn\'t get right valication code back');
      
      done();
    })
  });
  
  it('should get a UG record for a registration', function(done) {
    
    userGridUserManager.getUGRegistrationByEmail(emailToRegister, function(err, ugReg) {
      
      assert.ok(!err, 'huh, got an error');
      
      var r = ugReg.get('email');
      
      assert.equal(r, emailToRegister, 'didn\'t get right record back');
      
      done();
    })
  });
  
  it('should update validation code for a registration', function(done) {
    
    var newRegInfo = { email: emailToRegister, validationCode: newValCode };
    
    userGridUserManager.upsertUserRegistration(newRegInfo, function(err, updatedUGReg) {
      assert.ok(!err, 'weird, had error');
      
      userGridUserManager.getUGRegistrationByEmail(emailToRegister, function(err, updatedUGReg) {
        
        assert.equal(updatedUGReg.get('email'), emailToRegister, 'didn\'t get right email back');
        assert.equal(updatedUGReg.get('validation_code'), newValCode, 'didn\'t get right new val code back');
        
        done();
      });
    });
  });

  it('should be able to get uuid from a UG REST response', function() {

    // Actual response

    var ug = { 
      action: 'post',
      application: '94ec5f09-d908-11e1-afad-12313b01d5c1',
      params:
      { client_secret: [ 'b3U6z-d4_iF8UbxNt9aqNqtzHDSBV9s' ],
        client_id: [ 'b3U6dEm4a9j5EeGvrRIxOwHVwQ' ] },
      path: '/assets',
      uri: 'http://api.usergrid.com/tagg/tagg/assets',
      entities:
        [ { uuid: '17503c00-1927-11e3-acda-f72a7901be3c',
          type: 'asset',
          name: 'fyf-schedule-weekend.jpg',
          created: 1378714143679,
          modified: 1378714143679,
          owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc',
          path: '/assets/profile_avatars/0b1ac591207dafca537ce0bf88cd7408',
          'content-type': 'image/jpeg',
          metadata: [Object] } ],
      timestamp: 1378714143676,
      duration: 92,
      organization: 'tagg',
      applicationName: 'tagg' }

    // From the first item in 'entities' above
    var e = '17503c00-1927-11e3-acda-f72a7901be3c';

    var r = userGridUserManager.getUuidOfNewEntity(ug);
    
    assert.equal(r, e, 'didn\'t get right uuid back');
    
  });



});
