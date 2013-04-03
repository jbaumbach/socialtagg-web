/**
 * User: jbaumbach
 * Date: 3/17/13
 * Time: 3:58 PM

 * GET contact us page.
 */

var globalFunctions = require('./../common/globalfunctions')
  , userManager = require('./../data/userManager')
  , application = require('../common/application')
  , email = require('../common/email')
  , sanitize = require('validator').sanitize
  ;

exports.contact = function(req, res) {

  // todo: take login logic from index.js and create function in application.js to build the base pageVars object below

    var pageVars =
    {
      title: 'Contact Us',
      currentSessionUser: {},
      links: application.links()
    };

    res.render('contactus', pageVars);

};


exports.contacted = function(req, res) {

  //
  // todo: implement that cool validator indicated in user.js submission comments
  //
  var haveFields = req.body && 
    req.body.email && 
    req.body.email.length > 0 && 
    req.body.message && 
    req.body.message.length > 0;
  
  if (haveFields) {
    var plainTextBody = 'A "Contact Us" form has been submitted on the socialtagg.com website.  The submitted info is as follows: ' +
      '\r\n\r\n' +
      'Name: ' + sanitize(req.body.name).entityEncode() + '\r\n' +
      'Email: ' + sanitize(req.body.email).entityEncode() + '\r\n\r\n' +
      'Message: ' + sanitize(req.body.message).entityEncode();
    
    var params = {
      subject: 'Contact-us form submission',
      plainTextBody: plainTextBody,
      htmlBody: '<body><p>' + plainTextBody.replace(/\r\n/g, '<br>') + '</p></body>',
      toEmail: 'social-tagg@googlegroups.com',
      fromEmail: 'noreply@socialtagg.com',
      fromName: 'SocialTagg.com'
    };
    
    email.sendGenericEmail(params, function(err, info) {
      if (err) {
        
        res.send(500, { status: 500, message: 'oops, error!  see server log.'} );
        
      } else {
        res.send(200, { status: 200, message: 'submission successful'} );
        
      };
    });
  }
  else {
    res.send(401, { status: 401, message: 'missing fields'} );
  }

};