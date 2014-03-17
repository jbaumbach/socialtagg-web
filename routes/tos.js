/**
 * User: jbaumbach
 * Date: 5/14/13
 * Time: 8:28 PM
 */

var application = require('../common/application')
  , fs = require('fs')
  , globalFunctions = require('./../common/globalfunctions')
  , application = require('../common/application')
;

exports.main = function(req, res) {

  var pageVars =
  {
    title: 'Terms of Service',
    htmlizedTos: 'Terms of service not available.'
  };

  // Read the file and print its contents.
  var tosFilename = globalVariables.serverPhysicalPath + '/misc/tos.txt';
  
  fs.readFile(tosFilename, 'utf8', function(err, data) {
    
    if (err) {
      console.log('error reading tos.txt: ' + err)
    } else {
      pageVars.htmlizedTos = data.htmlize();
    }

    application.buildApplicationPagevars(req, pageVars, function(pageVars) {
      res.render('tos', pageVars);
    });
  });
};
