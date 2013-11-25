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


var getEventSummary = exports.getEventSummary = function(options, events) {
  
  if (!events) {
    console.log('(warning) no events passed!');
  }
  
  var mapper = function(event) {
    var m = moment(+event.created);
    event.dayOfYear = m.dayOfYear();
    event.week = m.week();
    event.month = m.month();
    event.dateStr = moment().week(event.week).format('dddd, MMMM Do YYYY');
    return event;
  }

  var reducer = function(memo, event) {
    var week = memo[event.week] || {};
    week.week = event.week;
    week.desc = 'Week of ' + event.dateStr;
    week.eventCount = ++week.eventCount || 1;
    memo[event.week] = week;
    
    return memo;
  }
  
  var summary = _.
    chain(events).
    map(mapper).
    reduce(reducer, {}).
    value();

  return summary;
}

exports.index = function(req, res) {

  async.waterfall([
    function userInfo(cb) {
      application.getCurrentSessionUser(req, function(user) {
        cb(null, user);
      });
    },
    function buildPageVars(user, cb) {
      var initialPageVars = {
        title: 'Admin Tools',
        displayUser: user
      };
      cb(null, initialPageVars);
    },
    function getEventCounts(initialPageVars, cb) {
      eventManager.getEventCounts(null, function(err, events) {

        //console.log('got events: ' + util.inspect(events));
        
        //
        // Group the results
        //
        var summary = getEventSummary(null, events);
        
        //console.log('got summmary: ' + util.inspect(summary));
        
        
        initialPageVars.eventSummary = summary;
        cb(err, initialPageVars);
      })
    }
  ], function done(err, initialPageVars) {
    application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
      console.log('pageVars: ' + util.inspect(pageVars));
      res.render('admin/index', pageVars);
    });
  })
  
  
/*
  application.getCurrentSessionUser(req, function(user) {

    var initialPageVars = {
      title: 'Admin Tools',
      displayUser: user
    };

    application.buildApplicationPagevars(req, initialPageVars, function(pageVars) {
      res.render('admin/index', pageVars);
    });
  });
*/
  
}
