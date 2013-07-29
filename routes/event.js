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
  
  eventManager.getEvent(eventId, function(err, event) {

    console.log('(GET) event.detal - err: ' + err);
    
    if (!err) {
      
      pageVars.event = event;
      pageVars.title = pageVars.event.name + ' - Details';
      done();
      
    } else {
      
      pageVars.title = 'Event Not Found';
      done();
      
    }
    
  });
  
};
