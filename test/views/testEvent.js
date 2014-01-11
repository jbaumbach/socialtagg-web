//
// Let's test that our features page renders properly.
//

var request = require('supertest')
  , myApp = require(process.cwd() + '/app.js');

var app = myApp.app();

describe('event page', function() {

  this.timeout(10000);
  
  it('should load the socialtagg sample event', function(done) {
    request(app)
      .get('/events/f6985b7a-51b4-11e3-9a86-a9773ebf9df2')
      .expect(/SocialTagg BBQ/)  // A class with a feature section.  \s is whitespace.
      .expect(200, done);
  });
});
