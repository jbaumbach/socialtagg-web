/*

  Here are some integration tests to make sure that node.js, express, and your routes are set up properly.
  These are good to have around to regression test your app as you develop and refactor.
  
  The "supertest" component is good for this.

    https://github.com/visionmedia/supertest
 
 */
  
var request = require('supertest')
  , myApp = require('../../app.js')
  , util = require('util')
  ;

var app = myApp.app();

// Note: same test user as in 'testUserApi.js'
var changeableUserEmail = 'blah@blah.com';
var changeableUserName = 'John\'s Test User - Dont Modify';
var changeablePw = 'yodayoda';  // util.format('%d', new Date());

//
// Note: if the db closes in other tests, routes here that call the database will bomb out.
//

describe('login and user features', function() {

  this.timeout(9000);

  it('should have login fields on login page', function(done) {
    request(app)
      .get('/login')
      .expect(/secureProtocol&quot;:&quot;http&quot;/)  // should have secure server
      .expect(/loginDest&quot;:&quot;.*&quot;/)         // should have a login destination
      .expect(/input.*type="password"/)
      .expect(200, done);
  });
  
  //
  // Note: these tests rely on your existing user (see: testUserManager.js)
  // 
  it.skip('should show error for an incorrect login', function(done) {
    request(app)
      .post('/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=neo@thematrix.com&password=wrongpassword')
      .expect(/p.*class="error"/)
      .expect(200, done);
  });

  //
  // Todo: figure out why usergrid doesn't like logging in a user with perfectly good info
  // via supertest, even though it works fine in a browser.
  //
  it.skip('should allow login of known user', function(done) {
    var email = changeableUserEmail;
    var password = changeablePw;
    
    request(app)
      .post('/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(util.format('email=%s&password=%s', email, password))
      .expect(302, done);
  });

  it('should not have # symbol in front of user bio', function(done) {
    request(app)
      .get('/users/3d86497b-66c4-11e2-8b37-02e81ac5a17b') // Jeff Mock
      // <div class="headline no-margin">\n          <h3>Bio</h3>\n        </div>\n        <p>Jeff is the lead iOS
      .expect(/<h3>Bio<\/h3>\s*<\/div>\s*<p>(\s| )*\w*/m)    // paragraph tag followed by whitespace followed by letters
      .expect(200, done);

  });

  it('should redirect Karim\'s deleted uuid to new uuid', function(done) {
    request(app)
      .get('/users/5329e985-5a08-11e2-924d-02e81ac5a17b') // Karim's old one
      .expect('Location', '/users/1da5e0ea-c8f1-11e2-8424-ade3d689326d')
      .expect(301, done);
  });

});
