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
  , SurveyQuestion = require('../models/SurveyQuestion')
  ;

exports.detail = function(req, res) {

  var pageVars = {
    title: 'Event Detail'
  };

  var printerFriendly = req.query.prn;
  var viewToRender = printerFriendly ? 'eventprinterfriendly' : 'eventview';
  
  if (!printerFriendly) {
    pageVars.usesAngular = true;
  }

  function done() {
    application.buildApplicationPagevars(req, pageVars, function(pageVars) {
      res.render(viewToRender, pageVars);
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
      
      //
      // Test event - SocialTagg F2F has good data
      //
      isEventOwner = (isEventOwner || event.uuid === 'be1b65e0-3e71-11e3-a797-1399e22b12e3')
      
      console.log('e: ' + event.uuid);
      
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

            //
            // Let's apply descriptions to each question for Jade to use to apply Legends to 
            // the chartable items.
            //
            SurveyQuestion.addDescriptionToQuestions(survey.questions);

            //
            // Let's split the questions into chartable and non-chartable.  Makes it easier
            // on the front end.
            //
            var surveyQs = {
              chartable: SurveyQuestion.surveyQuestionsChartable(survey.questions, true),
              nonChartable: SurveyQuestion.surveyQuestionsChartable(survey.questions, false)
            }

            dataForAngularInit.surveyQuestions = surveyQs;
            pageVars.surveyQuestions = surveyQs;
            
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


exports.checkInPage = function(req, res) {

  var pageVars = {
    title: 'Event Checkin Page'
  };

  function done() {
    application.buildApplicationPagevars(req, pageVars, function(pageVars) {
      res.render('eventcheckinpage', pageVars);
    });
  };

  var eventId = req.params.id;
  var userId = application.getCurrentSessionUserId(req);

  eventManager.getEvent(eventId, function(err, event) {

    if (!err) {

      if (userId && event.owner === userId) {

        console.log('event: ' + util.inspect(event));
        
        pageVars.event = event;
        pageVars.title = pageVars.event.name + ' - Details';

        done();
      } else {

        res.send(401, 'Sorry you are not authorized to view this page');
      }

    } else {
  
      res.send(404, 'Page not found');

    }

  });

};


