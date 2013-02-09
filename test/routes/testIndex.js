//
// Let's test that our index page renders properly.
//

var request = require('supertest')
  , myApp = require('../../app.js');

var app = myApp.app();

describe('homepage', function() {

  this.timeout(9000);

  it('should display some basic stuff', function(done) {
    request(app)
      .get('/')
      .expect(/<title>SocialTagg: Easily Create and Manage New Contacts<\/title>/)
      .expect(/<input id="mc-embedded-subscribe" type="submit" value="Subscribe" name="subscribe" class="button">/) 
      .expect(200, done);
  });
});
