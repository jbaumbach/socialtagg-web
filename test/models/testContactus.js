/**
 * User: jbaumbach
 * Date: 3/17/13
 * Time: 7:07 PM
 */

var assert = require('assert')
  , contactus = require('../../routes/contactus')
  , email = require('../../common/email')
  ;

var tempEmailFunction;

describe('contact us page', function() {

  before(function() {
    //
    // Record existing emailing function
    //
    tempEmailFunction = email.sendGenericEmail;
  });

  after(function() {
    //
    // Restore original emailing function
    //
    email.sendGenericEmail = tempEmailFunction;
  });

  this.timeout(9000);

  it('should not accept no input', function() {
    var req = {};
    
    //
    // We assume that our code will call the function "send" on the "res" object.  That's
    // where we'll do our assertin'.  The assumption itself is tested in other tests.
    // 
    var res = {
      send: function(code, obj) {
        assert.equal(code, 401, 'didn\'t send 401 http status code');
        assert.equal(obj.status, 401, 'didn\'t send JSON response correctly');
      }
    };
    
    contactus.contacted(req, res);
    
  });

  it('should not accept missing email address', function() {
    var req = { body: { email: '' }};
    var res = {
      send: function(code, obj) {
        assert.equal(code, 401, 'didn\'t send 401 http status code');
        assert.equal(obj.status, 401, 'didn\'t send JSON response correctly');
      }
    };

    contactus.contacted(req, res);

  });

  it('should handle error sending email gracefully', function() {
    var req = { body: { email: 'blah@blah.com', message: 'Yo, my message' } };
    var res = {
      send: function(code, obj) {
        assert.equal(code, 500, 'didn\'t send back a 500 http status code');
        assert.equal(obj.status, 500, 'didn\'t send JSON response correctly');
      }
    };

    //
    // Let's mock out this function to return what we want.
    //
    email.sendGenericEmail = function(params, callback) {
        callback(true, { msg: 'yup, had error'});
    };
    
    contactus.contacted(req, res);

  });

  it('should return proper response if email sent ok', function() {
    var req = { body: { email: 'blah@blah.com', message: 'Yo, my message' } };
    var res = {
      send: function(code, obj) {
        assert.equal(code, 200, 'didn\'t send 401 http status code');
        assert.equal(obj.status, 200, 'didn\'t send JSON response correctly');
      }
    };

    email.sendGenericEmail = function(params, callback) {
      callback(false, { msg: 'sent quite nicely'});
    };

    contactus.contacted(req, res);

  });

});
