/**
 * User: jbaumbach
 * Date: 3/17/13
 * Time: 6:46 PM
 */

//
// Let's test that our contact us page renders properly.
//

var request = require('supertest')
  , myApp = require('../../app.js')
;

var app = myApp.app();

describe('contact us page', function() {

  this.timeout(9000);

  it('should display a submittable form', function(done) {
    request(app)
      .get('/contactus')
      .expect(/<form method="post" action="\/contactus">/)
      .expect(200, done);
  });

  //
  // Remove the '.skip' to actually send an email
  //
  it.skip('should accept posted form and send the email', function(done) {
    request(app)
      .post('/contactus')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=social-tagg@googlegroups.com&message=There is no try.  Only do, or do not.')
      .expect(/submission successful/)
      .expect(200, done);
  });


});
