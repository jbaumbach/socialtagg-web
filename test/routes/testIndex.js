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
      .expect(/<a href="\/\/www.facebook.com\/socialtagg">/) // Social stuff
      .expect(/UA-36103900-2/) // Google anlaytics
      .expect(200, done);
  });
});
