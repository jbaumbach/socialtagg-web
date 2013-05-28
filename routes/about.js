/**
 * User: jbaumbach
 * Date: 4/15/13
 * Time: 7:28 PM
 */

var application = require('../common/application')
  ;

exports.main = function(req, res) {

  application.buildApplicationPagevars(req, { title: 'About'}, function(pageVars) {
    res.render('about', pageVars);
  });

};
