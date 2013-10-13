
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

// 2013/7/31 JB - Tim's team event for school
exports.specialEventsTeamExtCurrAct = function(req, res) {
  
  application.buildApplicationPagevars(req, { title: 'Special Event' }, function(pageVars) {
    res.render('specialevents/teamextracurricularactivity', pageVars);
  });
  
}


// 2013/10/13 JB - Jade's IMEX conference
exports.specialEventsImex = function(req, res) {

  application.buildApplicationPagevars(req, { title: 'IMEX Conference' }, function(pageVars) {
    res.render('specialevents/imexconference', pageVars);
  });

}