


var util = require('util')
  , globalFunctions = require('../../common/globalfunctions')
  , email = require('../../common/email')
  , assert = require('assert')
  ;


describe('common - email functions', function() {

  it('should build Mandrill post data from params w/o template', function() {
    var params = {
      subject: 'yo',
      plainTextBody: 'blah blah',
      toEmail: 'hello@there.com',
      fromEmail: 'luke@skywalker.com',
      fromName: 'Taggers',
      htmlBody: '<br>blah blah<br>'
    };

    var options = {};

    var res = email.buildMandrillPostDataFromParams(params, options);

    assert.equal(res.message.subject, params.subject, 'didn\'t set subject properly');
    assert.equal(res.message.to[0].email, params.toEmail, 'didn\'t set email properly');
    assert.equal(res.message.from_email, params.fromEmail, 'didn\'t get from email properly');
    assert.equal(res.message.from_name, params.fromName, 'didn\'t set from name properly');
    assert.equal(res.message.html, params.htmlBody, 'didn\'t set html body properly');
  });

  it('should build Mandrill post data from params with template', function() {
    var params = {
      subject: 'yo',
      plainTextBody: 'blah blah',
      toEmail: 'hello@there.com',
      templateName: 'uggabugga',
      mergeVars: [ { 'boom' : 'shakalaka' } ]
    };

    var options = {};

    var res = email.buildMandrillPostDataFromParams(params, options);

    assert.equal(res.message.subject, params.subject, 'didn\'t set subject properly');
    assert.equal(res.message.to[0].email, params.toEmail, 'didn\'t set email properly');
    assert.equal(res.template_name, params.templateName, 'didn\'t set template name properly');
    assert.equal(options.isTemplate, true, 'didn\'t set template bool properly');
  });

});

