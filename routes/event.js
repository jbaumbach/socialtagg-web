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
  

  var eventIds = [];
  eventIds.push(req.params.id);
  
  userManager.populateEvents(eventIds, function(events) {

    if (events && events.length > 0) {
      
      pageVars.event = events[0];
      pageVars.title = pageVars.event.name + ' - Details';
      done();
      
    } else {
      
      res.send(404, 'Sorry, that event is not found.');
    }
    
  });
  
};
