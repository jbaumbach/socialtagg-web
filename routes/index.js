
/*
 * GET home page.
 */

var globalFunctions = require('./../common/globalfunctions')
  , userManager = require('./../data/userManager')
  , application = require('../common/application')
  , userRoutes = require('./user')
  ;

exports.index = function(req, res){

  application.buildApplicationPagevars(req, { title: 'Home'}, function(pageVars) {
    res.render('index', pageVars);
  });

};
