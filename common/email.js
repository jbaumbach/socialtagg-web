/**
 * User: jbaumbach
 * Date: 3/10/13
 * Time: 9:58 PM
 */

var util = require('util')
  , globalfunctions = require('./globalfunctions')
  , thisModule = this
  ;

//
// Send an email via Mandrill
//
// Options:
//
//  bool isTemplate: true to use template
//
exports.sendMandrillEmail = function(postData, options, resultCallback) {

  var https = require('https');
  var response = '';
  var apiPath = options && options.isTemplate === true ?
    '/api/1.0/messages/send-template.json'
    :
    '/api/1.0/messages/send.json';

  var options = {
    hostname: 'mandrillapp.com',
    port: 443,
    path: apiPath,
    method: 'POST'
  };

  var req = https.request(options, function(apiRes) {
    apiRes.on('data', function(data) {
      response += data;
    });

    apiRes.on('end', function() {
      console.log('Mandrill response: (' + apiPath + ') ' + util.inspect(response));

      resultCallback(false, response);
    });
  });

  req.write(JSON.stringify(postData));

  req.on('error', function(e) {
    console.log('Error sending email: ' + e);
    resultCallback(true, 'error');
  });

  //
  // It's not super clear, but I believe this kicks off the request
  //
  req.end();

}

exports.buildMandrillPostDataFromParams = function(params, options) {
  //
  // postData is specific to Mandrill
  //
  var postData = {
    "key" : "d45dd60c-7dc4-4b1b-8857-86c791e068c1",
    "message" : {
      "subject" : params.subject,
      "text" : params.plainTextBody,
      "from_email" : params.fromEmail,
      "from_name" : params.fromName,
      "preserve_recipients" : false,
      "to" : [
        {
          "email" : params.toEmail
        }
      ]
    }
  };

  //
  // Conditionally included items
  //
  if (params.templateName) {
    postData.template_name = params.templateName;
    postData.template_content = [];
    postData.message.inline_css = true;
    postData.message.global_merge_vars = params.mergeVars;

    options.isTemplate = true;

  } else {
    //
    // There may be a bug here, Mandrill isn't understanding the HTML for some reason.
    //
    postData.html = params.htmlBody;
  }

  return postData;
};

//
// Send a generic email
//
// params:
//    subject
//    plainTextBody
//    toEmail (single email only is supported at this time)
//
//  If non-template:
//    htmlBody
//
//  If template:
//    templateName (sets inline_css to 'true')
//    mergeVars[]  (variables to stick in the pre-made template on Mandrill)
//
exports.sendGenericEmail = function(params, resultCallback) {

  var options = {};
  var postData = thisModule.buildMandrillPostDataFromParams(params, options);

  thisModule.sendMandrillEmail(postData, options, resultCallback);
}

