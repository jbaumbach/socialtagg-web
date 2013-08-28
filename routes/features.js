/**
 * User: jbaumbach
 * Date: 4/15/13
 * Time: 7:28 PM
 */

var application = require('../common/application')
  ;

/*
  The Features page
 */
exports.main = function(req, res) {
  application.buildApplicationPagevars(req, { title: 'Features'}, function(pageVars) {
    res.render('features', pageVars);
  });
};

/*
  The Pricing page
 */
exports.pricing = function(req, res) {
  application.buildApplicationPagevars(req, { title: 'Pricing' }, function(pageVars) {
    res.render('pricing', pageVars);
  });
};
