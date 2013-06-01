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

  it('should load up ok', function(done) {
    request(app)
      .get('/api/documentation')
      .expect(200, done);
  });
  
  
  // END
});
