/**
 * User: jbaumbach
 * Date: 1/29/13
 * Time: 12:46 AM
 */


var request = require('supertest')
  , myApp = require('../../app.js')
  , util = require('util')
  , globalFunctions = require('../../common/globalfunctions')
  , assert = require('assert')
  , userManager = require('../../data/userManager')
  , sinon = require('sinon')
  , email = require(process.cwd() + '/common/email.js')
  , _ = require('underscore')
;

var app = myApp.app();

var goodSampleUserId = 'b66a00ee-73d3-11e2-95c4-02e81ae640dc'; // John B.
var goodSampleUserEmail = 'john.j.baumbach@gmail.com';
var badSampleUserId = 'uggabugga';

var goodApiKey = '63f54fd4-7cb2-11e2-b6ef-02e81ac5a17b';
var goodApiPW = '46ea0d5b246d2841744c26f72a86fc29';

var authHeaderName = 'Authorization';
var authHeaderValue = function(apiKey, apiPW) {
  var hashVal = globalFunctions.sha256Encode(util.format('%s%s%d', apiKey, apiPW, Math.floor(new Date() / 1000)));
  return util.format('CustomAuth apikey=%s, hash=%s', apiKey, hashVal);
};

var changeableUserEmail = 'blah@blah.com';
var changeableUserUuid = 'ea10dde9-8a1b-11e2-b0a7-02e81ac5a17b';
var changeableUserName = 'John\'s Test User - Dont Modify';
var changeablePw = 'yodayoda';  // util.format('%d', new Date());
var newChangedPw = 'thepassword';
var verificationCode = '343434';
var nonexistantEmail = 'ugga98756@bugga123.com';

//**********************************************************************************************
var skipActualEmailSending = false;
//**********************************************************************************************


describe('api - user functions', function() {

  this.timeout(9000);

  //
  // Black-box functional tests - calls endpoints from a client
  //
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
      .expect(200, done)
  });

  it('should get a user ok and return valid JSON', function(done) {
    request(app)
      .get('/apiv1/users/' + goodSampleUserId)
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .expect(200)
      .end(function(err, res) {

        //
        // The body is automatically parsed into an object for us
        //
        var responseObject = res.body;
        assert.equal(responseObject.email, goodSampleUserEmail, 'didn\'t get correct email back');
        done();
      });
  });

  it('should bomb out if post and no action value', function(done) {
   request(app)
     .post('/apiv1/users')
     .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
     //.expect(/.*action.*missing/)
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
      .expect(400, done);
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

  it('should have err msg resetting password if missing POST params', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ action: 'resetpassword' }))
      .expect(/.*useremail.*missing/)
      .expect(400, done);
  });

  //
  // This will only work if the user in the db has the same validation code.  Not usually
  // a useful test automation-wise.  But can be run sometimes if you manually set the code
  // in usergrid (or create a new test user that has a consistent code)
  //
  it('should reset password with valid and existing verification code', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ 
        action: 'resetpassword', 
        useremail: changeableUserEmail, 
        originalcode: verificationCode, 
        newpassword: changeablePw
      }))
      .expect(/.*Password updated successfully/)
      .expect(200, done);
  });

  //
  // This will only work if the user in the db has the same validation code.  Not usually
  // a useful test automation-wise.  But can be run sometimes if you manually set the code
  // in usergrid (or create a new test user that has a consistent code)
  //
  it.skip('should return 404 for reset password with bad verification code', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({
        action: 'resetpassword',
        useremail: changeableUserEmail,
        originalcode: verificationCode,
        newpassword: changeablePw
      }))
      .expect(/verification code/)
      .expect(404, done);
  });

  it('should bomb sending updated profile email if no uuid passed ', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({
        action: 'updatedprofileemail'
      }))
      .expect(/useruuid.*missing/)
      .expect(400, done);
  });

  it('should bomb sending updated profile email if bad uuid passed', function(done) {
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({
        action: 'updatedprofileemail',
        useruuid: badSampleUserId
      }))
      .expect(/user id.*not found/)
      .expect(404, done);
  });

  it('should bomb sending updated profile email on user with no email address', function(done) {
    
    var origGetUserFunc = userManager.getUser;
    
    //
    // Mock up "getUser" function, always return a user but one w/o a valid email
    //
    userManager.getUser = function(userUuid, callback) {
      var result = { name: 'Han Solo' };  //, email: '' };  // both with "email" parameter and without work
      callback(result);
    };
    
    request(app)
      .post('/apiv1/users')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({
        action: 'updatedprofileemail',
        useruuid: badSampleUserId
      }))
      .expect(/user was found.*no email/)
      .expect(400, function() {
        // Reset our mock so other tests aren't affected
        userManager.getUser = origGetUserFunc;
        done();
      });
    
  });

  it('should return 404 for user contaggs call and bad id', function(done) {
    request(app)
      .get('/apiv1/users/idontexistatall/contaggs')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .expect(404, done);
  });
  
  
  it('should get user contaggs as csv', function(done) {
    
    request(app)
      // todo: change user id to 'changeableUserEmail' when that account has some contaggs
      //.get('/apiv1/users/' + goodSampleUserId + '/contaggs')
      //.get('/apiv1/users/3d86497b-66c4-11e2-8b37-02e81ac5a17b/contaggs')// Jeff, many contaggs
      .get('/apiv1/users/' + changeableUserUuid + '/contaggs')
      .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
      .expect(200)
      .end(function(err, res) {

        var responseCsv = res.text;
        assert.ok(responseCsv.match(/^Job Title/), 'didn\'t find title header value as first thing');
        
        var ct = res.headers['content-type'];
        assert.ok(ct.match(/text\/csv/), 'didn\'t have right content-type');
        
        done();
      });
  });

  //
  // These tests also test Mandrill.  Prolly could refactor/mock to add true unit tests.
  // Don't want to send an email every time you run the tests.  Unskip this to test periodically.
  //
  if (!skipActualEmailSending) {
    
    it.skip('should send a verificationemail email to a user with good info', function(done) {
      request(app)
        .post('/apiv1/users')
        .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ action: 'verificationemail', verificationcode: '1234', useremail: 'john.j.baumbach@gmail.com' }))
        .expect(200)
        .end(function(err, res) {
  
          //
          // The body string needs to be parsed into a json object since it was chunked manually by the email 
          // sender, rather than retrieved by the supertest request extension.
          //
          var responseObject = JSON.parse(res.body);
          assert.equal(responseObject[0].status, "sent", 'didn\'t send properly');
          done();
        });
    });
  
    it.skip('should send a forgot password email to a good email address', function(done) {
      request(app)
        .post('/apiv1/users')
        .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ action: 'forgotpasswordemail', useremail: 'john.j.baumbach@gmail.com' }))
        .expect(200)
        .end(function(err, res) {
          // Note: the test will have an error if the response body is not JSON (which in itself indicates an error)
          var responseObject = JSON.parse(res.body);
          assert.equal(responseObject[0].status, "sent", 'didn\'t send properly');
          done();
        });
    });

    it.skip('should send updated profile email to good user', function(done) {
      request(app)
        .post('/apiv1/users')
        .set(authHeaderName, authHeaderValue(goodApiKey, goodApiPW))
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          action: 'updatedprofileemail',
          useruuid: goodSampleUserEmail
        }))
        .expect(200)
        .end(function(err, res) {
          var responseObject = JSON.parse(res.body);
          assert.equal(responseObject[0].status, "sent", 'didn\'t send properly');
          done();
        });
    });

  }
  
  describe('resetPasswordWebsite() endpoint', function() {
    
    var userRaw;
    var setNewPasswordUrl = '/apiv1/users/' + changeableUserUuid + '/newpassword';

    it('should reject request without useremail in body', function(done) {
      request(app)
        .post('/apiv1/resetpassword')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          ugga: 'bugga'
        }))
        .expect(/parameter is missing/)
        .expect(400, done);
    });

    it('should not find a user with a bad useremail', function(done) {
      request(app)
        .post('/apiv1/resetpassword')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          useremail: nonexistantEmail 
        }))
        .expect(/user not found/i)
        .expect(404, done);
    });

    it('should properly set a code and call the email send function', function(done) {
      
      var emailStub = sinon.stub(email, 'sendGenericEmail', function(params, cb) {
        // test stuff
        assert.equal(params.toEmail, changeableUserEmail, 'didn\'t send to right email addr');

        assert.ok(params.plainTextBody.match(new RegExp(changeableUserUuid)), 'dind\'t find user id');

        var valCodeMatch = params.plainTextBody.match(/\?v=([0-9A-Fa-f\-]{36})/);
        var validationCode = (valCodeMatch && valCodeMatch.length > 1 && typeof valCodeMatch[1] == 'string') ? valCodeMatch[1] : null;
        
        assert.ok(validationCode, 'didn\'t get 36 char guid for verification code');
        
        // Display a test link
        console.log('plainTextBody: ' + params.plainTextBody);
//        console.log('htmlBody: ' + params.htmlBody);
//        
        userRaw = {
          id: changeableUserUuid,
          firstName: 'dontreallymatter',
          v: validationCode
        }

        cb();
      })
      
      request(app)
        .post('/apiv1/resetpassword')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          useremail: changeableUserEmail 
        }))
        .expect(/boom/i)
        .expect(200, function() {
          sinon.assert.callCount(emailStub, 1);
          emailStub.restore();
          done();
        });
    });

    it('should not reset password if passwords don\'t match', function(done) {
      assert.ok(userRaw, 'huh, don\'t have a good user (should have come from the email stub)');
      
      var passwordsNotMatchingUser = _.extend({},
        userRaw, 
        { password: 'ugga', password2: 'bugga'});

//      console.log('passwordsNotMatchingUser: ' + util.inspect(passwordsNotMatchingUser));
      
      request(app)
        .put(setNewPasswordUrl)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(passwordsNotMatchingUser))
        .expect(/the passwords should match/i)
        .expect(400, done);

    })

    it('should not reset password if user doesn\'t exist', function(done) {
      assert.ok(userRaw, 'huh, don\'t have a good user (should have come from the email stub)');

      var goodPasswordsButNonexistantUser = _.extend({},
        userRaw, 
        { id: badSampleUserId, password: newChangedPw, password2: newChangedPw});
      
//      console.log('goodPasswordsButNonexistantUser: ' + util.inspect(goodPasswordsButNonexistantUser));

      request(app)
        .put(setNewPasswordUrl)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(goodPasswordsButNonexistantUser))
        .expect(/Cant find user for id/i)
        .expect(404, done);

    })

    it('should not reset password if bad validation code', function(done) {
      assert.ok(userRaw, 'huh, don\'t have a good user (should have come from the email stub)');

      var goodPasswordsButBadCodeUser = _.extend({},
        userRaw, 
        { v: '42343232fdfdsf3424', password: newChangedPw, password2: newChangedPw});
      
//      console.log('goodPasswordsButBadCodeUser: ' + util.inspect(goodPasswordsButBadCodeUser));

      request(app)
        .put(setNewPasswordUrl)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(goodPasswordsButBadCodeUser))
        .expect(/Nope, validation code doesn/i)
        .expect(400, done);

    })

    // To test this feature in a browser, skip this test and use the link from the email printed above.
    it.skip('should reset password if good validation code', function(done) {
      assert.ok(userRaw, 'huh, don\'t have a good user (should have come from the email stub)');

      var goodUser = _.extend({},
        userRaw, 
        { password: newChangedPw, password2: newChangedPw});
      
//      console.log('goodUser: ' + util.inspect(goodUser));

      request(app)
        .put(setNewPasswordUrl)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(goodUser))
        .expect(200, done);

    })

  });
  
});