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

   it('should not send an email to an unknown user', function(done) {
   request(app)
     .post('/apiv1/users/' + badSampleUserId + '?action=verificationemail')
     .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
     .expect(404, done);
   });

  it('should not send an email to a known user w/o a verification code', function(done) {
    request(app)
      .post('/apiv1/users/' + goodSampleUserId + '?action=verificationemail')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .expect(400, done);
  });

  //
  // Don't want to send an email every time you run the tests.  Unskip this to test periodically.
  //
  it.skip('should send an email to a known user with good verification code', function(done) {
    request(app)
      .post('/apiv1/users/' + goodSampleUserId + '?action=verificationemail&verificationcode=' + goodVerificiationCode)
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .expect(200, done);
  });

});