/**
 * User: jbaumbach
 * Date: 5/30/13
 * Time: 9:57 PM
 */

var request = require('supertest')
  , myApp = require('../../app.js')
  , util = require('util')
  , globalFunctions = require('../../common/globalfunctions')
  , assert = require('assert')
  ;

var app = myApp.app();

describe('api - documentation', function() {

  it('should redirect to authentication page', function(done) {
    request(app)
      .get('/api/documentation')
      .expect(302, done);
  });
  // END
});
