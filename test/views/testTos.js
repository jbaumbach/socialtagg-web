/**
 * User: jbaumbach
 * Date: 5/14/13
 * Time: 9:25 PM
 */

var request = require('supertest')
  , myApp = require('../../app.js')
  , util = require('util')
  ;

var app = myApp.app();

//
// Note: if the db closes in other tests, routes here that call the database will bomb out.
//

describe('terms of service page', function() {

  it('should have some paragraphs', function(done) {
    request(app)
      .get('/termsofservice')
      .expect(/You agree that by registering on SocialTagg/)
      .expect(200, done);
  });
});
