//
// Let's test that our features page renders properly.
//

var request = require('supertest')
  , myApp = require('../../app.js');

var app = myApp.app();

describe('features page', function() {

  it('should display some features', function(done) {
    request(app)
      .get('/features')
      .expect(/Connecting people at events/)  // A class with a feature section.  \s is whitespace.
      .expect(200, done);
  });
});
