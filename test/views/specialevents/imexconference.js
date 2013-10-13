/**
 * User: jbaumbach
 * Date: 10/13/13
 * Time: 10:22 AM
 */

var request = require('supertest')
  , myApp = require('../../../app.js');

var app = myApp.app();

describe('IMEX conference page', function() {

  it('should exist', function(done) {
    request(app)
      .get('/imex')
      .expect(/Join us for the SocialTagg Launch!/)
      .expect(200, done);
  });
});
