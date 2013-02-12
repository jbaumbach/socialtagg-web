
/*
 * GET home page.
 */

var globalfunctions = require('./../common/globalfunctions')
  , userManager = require('./../data/userManager')
  , application = require('../common/application')
  ;

exports.index = function(req, res){
  
  application.getCurrentSessionUser(req, function(currentSessionUser) {

    var pageVars =
    {
      title: 'SocalTagg',
      currentSessionUser: currentSessionUser
    };

    res.render('index', pageVars);
  });
};

exports.originalHomepage = function(req, res) {
  res.render('originalHomepage');
}