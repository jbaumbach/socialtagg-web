var userManager = require(process.cwd() + '/data/userManager')
  , util = require('util')
  , globalfunctions = require(process.cwd() + '/common/globalfunctions')
  , User = require(process.cwd() + '/models/User')
  , application = require(process.cwd() + '/common/application')
  , async = require('async')
  , eventManager = require(process.cwd() + '/data/eventManager')
  , moment = require('moment')
  , _ = require('underscore')
  ;



exports.index = function(req, res) {

  application.getCurrentSessionUser(req, function(user) {

    var initialPageVars = {
      title: 'Admin Tools',
      displayUser: user
    };

    application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
      res.render('admin/index', pageVars);
    });
  });
  
}
