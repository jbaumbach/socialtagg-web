/**
 * User: jbaumbach
 * Date: 1/29/13
 * Time: 12:46 AM
 */


var request = require('supertest')
  , myApp = require('../../app.js')
  , util = require('util')
  , globalFunctions = require('../../common/globalfunctions')
  ;

var app = myApp.app();

var goodSampleUserId = 'b66a00ee-73d3-11e2-95c4-02e81ae640dc'; // John B.
var badSampleUserId = 'uggabugga';

var goodApiKey = '63f54fd4-7cb2-11e2-b6ef-02e81ac5a17b';  // Created in usergrid (and hard coded for now)
var goodApiPW = '46ea0d5b246d2841744c26f72a86fc29';

var authHeaderName = 'Authorization';
var authHeaderValue = function(apiKey, apiPW) {
  var hashVal = globalFunctions.sha256Encode(util.format('%s%s%d', apiKey, apiPW, Math.floor(new Date() / 1000)));
  return util.format('CustomAuth apikey=%s, hash=%s', apiKey, hashVal);
};

var goodVerificiationCode = '6414';

describe('api - user functions', function() {

  this.timeout(90000);

  
  it('should get 404 for unknown user and explain the bad id', function(done) {
    request(app)
      .get('/apiv1/users/' + badSampleUserId)
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .expect(eval('/' + badSampleUserId + '/'))
      .expect(404, done);
  });
  
  it('should get a user ok', function(done) {
    request(app)
      .get('/apiv1/users/' + goodSampleUserId)
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .expect(200, done);
  });

   it('should bomb out if post and no action value', function(done) {
   request(app)
     .post('/apiv1/users')
     .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
     .expect(/.*action.*missing/)
     .expect(400, done);
   });

  //
  // This is failing because Express prints out a stack trace.  To fix.
  //
  it.skip('should bomb out gracefully if malformed JSON', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send('{ crappyjson }')
      .expect(/.*action.*not allowed/)
      .expect(400, done);
  });

  it('should bomb out if post and invalid action value', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ action: 'uggabugga' }))
      .expect(/.*action.*not allowed/)
      .expect(403, done);
  });

  it('should not send a verificationemail email w/o a verification code', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ action: 'verificationemail' }))
      .expect(/.*verificationcode.*missing/)
      .expect(400, done);
  });

  it('should not send a verificationemail email w/o an email address', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ action: 'verificationemail', verificationcode: '1234' }))
      .expect(/.*useremail.*missing/)
      .expect(400, done);
  });

  //
  // Run this if you get the email validator from chriso working.
  //
  it.skip('should not send a verificationemail email to invalid email address', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ action: 'verificationemail', verificationcode: '1234', useremail: 'lukeskywalker' }))
      .expect(/.*useremail.*invalid/)
      .expect(400, done);
  });

  //
  // Don't want to send an email every time you run the tests.  Unskip this to test periodically.
  //
  it.skip('should send a verificationemail email to a user with good info', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ action: 'verificationemail', verificationcode: '1234', useremail: 'john.j.baumbach@gmail.com' }))
      .expect(200, done);
  });

  it('should not send a forgot password email whem email address is missing', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ action: 'forgotpasswordemail' }))
      .expect(/.*parameter.*missing/)
      .expect(400, done);
  });

  it('should not send a forgot password email to a bad email address', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ action: 'forgotpasswordemail', useremail: 'blahblah@blah.com' }))
      .expect(/blahblah@blah.com/)
      .expect(404, done);
  });

  it('should send a forgot password email to a good email address', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ action: 'forgotpasswordemail', useremail: 'john.j.baumbach@gmail.com' }))
      .expect(200, done);
  });


});