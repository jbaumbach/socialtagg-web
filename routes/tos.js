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

  // todo: take login logic from index.js and create function in application.js to build the base pageVars object below

  var pageVars =
  {
    title: 'Terms of Service',
    currentSessionUser: {},
    links: application.links(),
    htmlizedTos: 'Terms of service not available.'
  };

  // Read the file and print its contents.
  var tosFilename = application.globalVariables.serverPhysicalPath + '/misc/tos.txt';
  
  fs.readFile(tosFilename, 'utf8', function(err, data) {
    
    if (err) {
      console.log('error reading tos.txt: ' + err)
    } else {
      pageVars.htmlizedTos = data.htmlize();
    }
    
    res.render('tos', pageVars);

  });
};
