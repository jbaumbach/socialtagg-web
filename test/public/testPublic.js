/**
 * User: jbaumbach
 * Date: 6/1/13
 * Time: 3:20 PM
 */

var request = require('supertest')
  , myApp = require('../../app.js')
  , util = require('util')
  ;

var app = myApp.app();

describe('public files', function() {

  it('should have max age for caching', function(done) {
    request(app)
      .get('/css/style.css')
      .expect('Cache-Control', /.*max-age=[0-9]+/)
      .expect(200, done);
  });

});
