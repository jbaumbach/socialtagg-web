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
//  { bool isTemplate: true to use template }
//
exports.sendMandrillEmail = function(postData, options, resultCallback) {

  var https = require('https');
  var response = '';
  var apiPath = options && options.isTemplate === true ?
    '/api/1.0/messages/send-template.json'
    :
    '/api/1.0/messages/send.json';

  //
  // 2013-05-07 JB: Mandrill got more strict with their API - let's conform more closely
  // with the http spec and specify the headers explicitly (especially content length)
  //
  var dataToPost = JSON.stringify(postData);
  var headers = {
    'Content-Type': 'application/json',
    'Content-Length': dataToPost.length
  };


  var options = {
    hostname: 'mandrillapp.com',
    port: 443,
    path: apiPath,
    method: 'POST',
    headers: headers
  };

  var req = https.request(options, function(apiRes) {

    var responseStatuscode = apiRes.statusCode;
    var hadError = responseStatuscode != 200;

    apiRes.on('data', function(data) {
      response += data;
    });

    apiRes.on('end', function() {
      //
      // Write some stuff to the logs
      //
      console.log('Mandrill response: (' + apiPath + ') code: ' + 
        responseStatuscode + 
        ', had error? ' + hadError + ', ' +
        response);

      if (hadError) {
        //
        // Write a bunch more stuff to the logs
        //
        console.log('Mandrill data posted: ' + util.inspect(postData));
        console.log('Mandrill https options: ' + util.inspect(options));
      }
      
      //
      // Sometimes this happens:
      //
      // [{"email":"john.j.baumbach@gmail.com","status":"rejected","_id":"a956dca43ef34864b4f64aa6c5a66e36"}]
      //
      
      resultCallback(hadError, response);
    });
  });

  //
  // The writing of our post data
  //
  req.write(dataToPost);

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
    postData.message.html = params.htmlBody;
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
//    fromEmail
//    fromName
//
//  If non-template:
//    htmlBody
//
//  If template:
//    templateName (sets inline_css to 'true')
//    mergeVars[]  (variables to stick in the pre-made template on Mandrill)
//
// callback: function(err, info) {}
//
exports.sendGenericEmail = function(params, resultCallback) {

  var validData = params &&
    params.subject &&
    params.plainTextBody &&
    params.toEmail &&
    params.fromEmail &&
    params.fromName;
  
  if (validData) {
    var options = {};
    var postData = thisModule.buildMandrillPostDataFromParams(params, options);
  
    thisModule.sendMandrillEmail(postData, options, resultCallback);
  }
  else {
    resultCallback(true, [{ status: 'Missing required parameters' }]);
  }
}

