/**
 * User: jbaumbach
 * Date: 4/15/13
 * Time: 7:28 PM
 */

var application = require('../common/application')
  ;

exports.main = function(req, res) {

  // todo: take login logic from index.js and create function in application.js to build the base pageVars object below

  var pageVars =
  {
    title: 'Features',
    currentSessionUser: {},
    links: application.links()
  };

  res.render('features', pageVars);

};
