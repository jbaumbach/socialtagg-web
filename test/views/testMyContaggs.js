/**
 * User: jbaumbach
 * Date: 7/1/13
 * Time: 9:28 PM
 */


var request = require('supertest')
  , myApp = require('../../app.js')
  , util = require('util')
  ;

var app = myApp.app();

// Note: same test user as in 'testUserApi.js'
var changeableUserEmail = 'blah@blah.com';
var changeablePw = 'yodayoda';  // util.format('%d', new Date());

//
// Note: if the db closes in other tests, routes here that call the database will bomb out.
//

describe('mycontaggs page', function() {

  this.timeout(9000);

  it('should redirect to login page if not logged in', function(done) {
    request(app)
      .get('/mycontaggs')
      .expect(302, done);
  });

  // todo: test contaggs after figuring out how to log a user in
  
});