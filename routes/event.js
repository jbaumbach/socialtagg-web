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
  
  function done() {
    application.buildApplicationPagevars(req, pageVars, function(pageVars) {
      res.render('eventanalytics', pageVars);
    });
  };

  var eventId = req.params.id;
  var userId = application.getCurrentSessionUserId(req);

  var pageVars = {
    title: 'Event Analytics',
    usesAngular: true
  };

  eventManager.getEvent(eventId, function(err, event) {

    if (!err) {

      var isEventOwner = (userId && event.owner === userId);
      
      if (isEventOwner) {

        // 
        // OK, we can display the page
        //
        pageVars.event = event;

        var dataForAngularInit = {
          uuid: event.uuid
        }

        pageVars.title = pageVars.event.name + ' - Analytics';

        eventManager.getSurveyByEventId(event.uuid, function(err, survey) {

          if(!err && survey) {

            console.log('survey found');
            pageVars.survey = survey;
            dataForAngularInit.surveyQuestions = survey.questions;
          } else {
            console.log('no survey found');
          }

          pageVars.publicEvent = JSON.stringify(dataForAngularInit);

          done();
        });

      } else {

        res.send(403, 'Sorry, you do not have access to this page');
        
      }

    } else {

      res.send(404, 'Sorry, that event is not found');
    }

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


