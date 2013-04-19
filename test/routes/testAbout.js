/**
 * User: jbaumbach
 * Date: 4/18/13
 * Time: 11:31 PM
 */

// Los Angeles software company

var request = require('supertest')
  , myApp = require('../../app.js');

var app = myApp.app();

describe('about page', function() {

  it('should display a mission statement', function(done) {
    request(app)
      .get('/about')
      .expect(/Los Angeles software company/)
      .expect(200, done);
  });
});
