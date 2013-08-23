/**
 * User: jbaumbach
 * Date: 7/5/13
 * Time: 1:44 PM
 */

var userManager = require('./../data/userManager')
  , util = require('util')
  , globalfunctions = require('./../common/globalfunctions')
  , User = require('../models/User')
  , application = require('../common/application')
  , eventManager = require('../data/eventManager')
  ;

exports.detail = function(req, res) {

  var pageVars = {
    title: 'Event Detail'
  };

  function done() {
    application.buildApplicationPagevars(req, pageVars, function(pageVars) {
      res.render('eventview', pageVars);
    });
  };

  var eventId = req.params.id;
  var userId = application.getCurrentSessionUserId(req);
  
  eventManager.getEvent(eventId, function(err, event) {
    
    if (!err) {
      
      pageVars.event = event;
      pageVars.title = pageVars.event.name + ' - Details';
      pageVars.isEventOwner = (userId && event.owner === userId);
      
      done();
      
    } else {
      
      pageVars.title = 'Event Not Found';
      done();
      
    }
    
  });
  
};


exports.analytics = function(req, res) {
  
  var pageVars = {
    title: 'Event Analytics'
  };
  
  application.buildApplicationPagevars(req, pageVars, function(pageVars) {
    res.render('eventanalytics', pageVars);
  });
  
};


exports.printerFriendly = function(req, res) {

  var pageVars = {
    title: 'Printer Friendly'
  };

  application.buildApplicationPagevars(req, pageVars, function(pageVars) {
    res.render('eventprinterfriendly', pageVars);
  });


};


