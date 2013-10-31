/**
 * User: jbaumbach
 * Date: 7/9/13
 * Time: 4:30 PM
 */

var userManager = require('./../data/userManager')
  , eventManager = require('./../data/eventManager')
  , util = require('util')
  , globalfunctions = require('./../common/globalfunctions')
  , application = require('../common/application')
  , sprintf = require("sprintf-js").sprintf
  , _ = require('underscore')
  , SurveyQuestion = require('../models/SurveyQuestion')
  , async = require('async')
  , thisModule = this
  ;

//
// Possible survey and question types.  These must match the Angular page values 
// Todo: move these to a "Survey" model
//
var surveyTypes = [
  { label: 'When attendee checks in', value: 'showOnCheckin' },
  { label: 'A specific number of minutes after event ends', value: 'showAfterXMins' },
  { label: 'The next morning', value: 'showNextMorn' }
];

/*
  Return a list of events owned by the logged in user
 */
exports.eventsOwnedByUserId = function(req, res) {
  
  //
  // Grab user id from the session
  //

  var userId = application.getCurrentSessionUserId(req);

  if (!userId) {
    console.log('(warning) eventsOwnedByUserId - ain\'t got a user id');

    res.send(500, { msg: 'can\'t get user id from the session - try logging in again' });
    
  } else {

    userManager.getUserEventsOwned(userId, function(err, userEvents) {

      if (userEvents && userEvents.length > 0) {

      } else {

        userEvents = [];
      }
      
      res.send(200, userEvents);
      
    });
  }

};

/**
 * Validate a submitted survey's data fields.
 *
 * surveyRaw - the event data
 * 
 * Returns:
 *  an array of error messages that will get populated (cool future thing -
 *  use the field values as well, so the Angular form can automatically highlight the error fields)
 *
*/
exports.validateRawSurvey = function(surveyRaw) {

  var v = application.ErrorCollectingValidator();

  v.check(surveyRaw.whenToShowType, 'when to show type not selected').notNull();
  
  if (surveyRaw.whenToShowType) {
    
    if (!_.find(surveyTypes, function(type) { return surveyRaw.whenToShowType === type.value; })) {
      v.error('survey "when to show type" is not valid');
    };
  }

  if (surveyRaw.whenToShowType === 'showAfterXMins') {
    v.check(surveyRaw.whentoShowMins, 'enter valid number of minutes to show survey').isNumeric();
    
  }
  
  if (!surveyRaw.questions || surveyRaw.questions.length < 1) {
    
    v.error('please enter at least 1 survey question');
    
  } else {
    
    surveyRaw.questions.forEach(function(question, index) {
      
      var displayIndex = index + 1;
      v.check(question.text, 'please enter some text for question ' + displayIndex).notNull().notEmpty();

      if (!_.find(SurveyQuestion.questionTypes, function(qtype) { return question.type === qtype.value; })) {
        v.error('please enter a valid type for question ' + displayIndex);
      };

      if (question.type === 'multichoice') {
        
        if (!question.choices || question.choices.length <= 1) {

          v.error('please enter at least two options for multiple choice question ' + displayIndex);
          
        } else {
          
          question.choices.forEach(function(choice, choiceIndex) {
         
            v.check(choice, 'please enter some text for choice ' + (choiceIndex + 1) + ' of question ' + displayIndex).notEmpty();
            
          });
        }
      }
    });
  }
  
  
  return v.getErrors();
  
};

/**
 * Validate a submitted event's data fields. 
 * 
 * eventRaw - the event data
 *
 * Returns:
 *  an array of error messages (cool future thing -
 *  use the field values as well, so the Angular form can automatically highlight the error fields)
 *
 *
 * Note: one small tech debt item:
 *
 * This function replaces the .startDate and .endDate values submitted by
 * the form as the user's date string with their parsed equivalents using
 * the user's entered time and timezone.  So, it's not strictly validating.
 * However, it seemed like the most logical place to put this behavior
 * since the user entered values ALSO are being validated here.
 * todo: A good fix would be change .startDate to .startDateTime and fill THAT in
 * with the built value.
 */
exports.validateRawEventAndConvertDates = function(eventRaw) {

  var v = application.ErrorCollectingValidator();

  v.check(eventRaw.owner, 'the event owner is not present').notNull();
  v.check(eventRaw.name, 'name should be between 1 and 100 chars').len(1, 100);
  v.check(eventRaw.description, 'description should not be blank').notNull();
  v.check(eventRaw.address, 'address should not be blank').notNull();
  v.check(eventRaw.timezoneOffset, 'timezone is not set or invalid').isInt().max(14).min(-14); // 14 either way as per 'moment' docs
  //v.check(eventRaw.checkinPeriodStartTimeMins, 'checkin period in minutes is not valid').isInt();

  
  // Assemble the date/time/timezone fields.  There may be a better
  // pattern, but a lot of refactoring will be required.  Let's 
  // just get 'er done for now.

  if (eventRaw.timezoneOffset) {
    
    eventRaw.startDate = application.getDatetimeFromStringParts(eventRaw.startDate, eventRaw.startTime, eventRaw.timezoneOffset);
    eventRaw.endDate = application.getDatetimeFromStringParts(eventRaw.endDate, eventRaw.endTime, eventRaw.timezoneOffset);
    
  }

  v.check(eventRaw.startDate, 'start date or time is blank or invalid').isInt();
  v.check(eventRaw.endDate, 'end date or time is blank or invalid').isInt();


  if (eventRaw.website) {
    v.check(eventRaw.website, 'website is not a valid url').isUrl();
  }
  
  return v.getErrors();
}

/*
  Insert an event into the DB
 */
exports.insertOwnedEvent = function(req, res) {
  
  var eventRaw = req.body;
  eventRaw.owner = application.getCurrentSessionUserId(req);
  var invalidDataMsgs = thisModule.validateRawEventAndConvertDates(eventRaw);
  
  if (invalidDataMsgs.length > 0) {
    
    res.send(400, { errors: invalidDataMsgs });
    
  } else {
    
    // insert to db
    eventManager.insertEvent(eventRaw, function(err, insertedEvent) {

      if (err) {
        
        res.send(500, { msg: err });

      } else {

        res.send(200, insertedEvent );
      }
    });
  }
}

/*
  Update an event in the database
 */
exports.updateOwnedEvent = function(req, res) {
  
  var uuid = req.params.id;

  var eventRaw = req.body;
  var invalidDataMsgs = thisModule.validateRawEventAndConvertDates(eventRaw);

  if (invalidDataMsgs.length > 0) {

    res.send(400, { errors: invalidDataMsgs });

  } else {

    //
    // todo: fix security hole - owner id is not checked with logged in user
    // 
    var updatedEvent = eventRaw;

    // update event in db

    eventManager.updateEvent(eventRaw, function(err, updatedEvent) {

      if (err) {

        res.send(500, { msg: err });

      } else {

        res.send(200, updatedEvent );
      }

    })
  }

}

/*
  Delete an event from the database.  Don't actually delete, just 
  inactivate.
 */
exports.deleteOwnedEvent = function(req, res) {
  
  var uuid = req.params.id;
  
  if (!uuid) {

    res.send(400, { msg: 'no event id provided'});

  } else {

    eventManager.getEvent(uuid, function(err, event) {

      if (err) {

        res.send(500, { msg: 'a server error has occurred!'});

      } else if (!event) {

        res.send(404, { msg: util.format('event id "%s" not found', uuid)});

      } else {

        event.inactiveInd = 'true';
        
        eventManager.updateEvent(event, function(err, event) {
   
          if (!err) {
            
            res.send(200, { msg: 'deleted event ok'} );
            
          } else {
            
            res.send(500, { msg: 'a server error has occurred!'});

          }
        });
      }
    })
  }
}

/*
  Get an event survey
 */
exports.getEventSurvey = function(req, res) {
  
  var eventId = req.params.eventId;

  console.log('(info) found id: ' + eventId + ', is our id? ' + (eventId != '1234'));
  
  if (!eventId) {
    
    res.send(400, { msg: 'no event id provided'});
    
  } else {

    eventManager.getSurveyByEventId(eventId, function(err, survey) {
      
      if (err) {
        
        res.send(500, { msg: 'a server error has occurred!'});
        
      } else if (!survey) {
        
        res.send(404, { msg: util.format('event id "%s" not found', eventId)});
        
      } else {
        
        res.send(200, survey);
      }
    })
  }
  
}

/*
  Inserts a new survey into the database
 */
exports.insertEventSurvey = function(req, res) {
  
  var surveyRaw = req.body;
  var invalidDataMsgs = thisModule.validateRawSurvey(surveyRaw);

  if (invalidDataMsgs.length > 0) {

    res.send(400, { errors: invalidDataMsgs });

  } else {

    // insert to db
    eventManager.insertSurvey(surveyRaw, function(err, insertedSurvey) {

      if (err) {

        res.send(500, { msg: err });

      } else {

        res.send(201, insertedSurvey );
      }
    });
  }
}

/*
  Updates a server in the database
 */
exports.updateEventSurvey = function(req, res) {
  
  var surveyRaw = req.body;
  var invalidDataMsgs = thisModule.validateRawSurvey(surveyRaw);

  if (invalidDataMsgs.length > 0) {

    res.send(400, { errors: invalidDataMsgs });

  } else {

    // insert to db
    eventManager.updateSurvey(surveyRaw, function(err, updatedSurvey) {

      if (err) {

        res.send(500, { msg: err });

      } else {

        res.send(200, updatedSurvey );
      }
    });
  }
  
}

/*
  Gets the '12' in a string like 'sq-12'
 */
exports.getSurveyQuestionNumberFromString = function(surveyQuestionValue) {
  var result;
  var surveyQuestionId = surveyQuestionValue.match(/sq-([0-9]*)/i);

  console.log(util.inspect(surveyQuestionId));
  
  if (surveyQuestionId && surveyQuestionId.length > 1) {
    result = surveyQuestionId[1];
  }
  
  return result;
}

//
// The chart library on the page bombs out with certain characters, such as XSS type attack vectors.
// This filters out everything but stuff you'd expect to see in a title/company name
//
var displayFilter = /[^a-zA-Z0-9_\.\-,/?<>[]{}!@#$%^&*()+= ]/g;

/**
 * For the passed array of users, tabulate descriptive items and return the results in
 * ready-to-use format.
 * 
 * @users {Array} - the list of users
 * 
 * Example result: 
 * 
   data = {
     labels: ['Microsoft', 'Google', 'Facebook', 'SocialTagg'],
     datasets: [
     {
       data: [75, 60, 45, 12]
     }]
   }
*/
var companySummaryFromUsers = exports.companySummaryFromUsers = function(users) {

  var options = {
    getKey: function(user) {
      return user.company.toLowerCase().replace(/[^a-z]/g, '').left(15);
    },
    getDescription: function(user) {
      return user.company.replace(displayFilter, '').truncate(15, true, '...');
    } 
  }
  
  return dataSummaryFromItems(users, options);
}

var jobTitleSummaryFromUsers = exports.jobTitleSummaryFromUsers = function(users) {

  var options = {
    getKey: function(user) {
      var result = user.title.toLowerCase().replace(/[^a-z]/g, '').left(15);
      return result;
    },
    getDescription: function(user) {
      return user.title.replace(displayFilter, '').truncate(20, true, '...');
    }
  }

  return dataSummaryFromItems(users, options);
}

/**
 * For the passed array of items, tabulate their companies and return the results in
 * ready-to-use format
 *
 * @items {Array} - the list of users
 * @options {Object} - two callback functions that help you build the results:
 *  getKey(item) - allows you to process the item's data and return a key
 *  getDescription(item) - (optional) allows you to return a description for the item..
 *
 * Example result:
 *
 data = {
     labels: ['Microsoft', 'Google', 'Facebook', 'SocialTagg'],
     datasets: [
     {
       data: [75, 60, 45, 12]
     }]
   }
 */
var dataSummaryFromItems = exports.dataSummaryFromItems = function(items, options) {

  var result = {
    labels: [],
    datasets: [
      {
        data: []
      }]
  }

  if (items && items.length > 0) {
    var tabulation = {};

    items.forEach(function(item) {
      //
      // Companies are the same if their name matches after removing non-letter characters
      // The company name (.desc) is whichever company name is encountered first.
      //
      var key = options.getKey(item);

      if (!tabulation[key]) {
        var value = {
          desc: options.getDescription(item),
          count: 0
        }
        tabulation[key] = value;
      }

      tabulation[key].count++;
    });

    //
    // Sort by the counts ASC
    //
    var r1 = _.pairs(tabulation);
    var r2 = _.sortBy(r1, function(item) { return -1 * item[1].count; });
    
    //
    // Only return the first 10 items
    //
    var r3 = r2.slice(0, 10);

    //
    // Take our raw data and put it into ready-to-use format.  This logic prolly
    // should be extracted, but it's easy to do here.  Refactor later if necessary.
    //

    r3.forEach(function(r) {
      result.labels.push(r[1].desc);
      result.datasets[0].data.push(r[1].count);
    });
  }

  return result;
}

/*
  Grab the question type for the passed survey and question id
 */
var getQuestionTypeForId = exports.getQuestionTypeForId = function(survey, questionId) {
  var result;
  
  if (survey && survey.questions && survey.questions.length > 0) {
    
    var theQuestion = _.find(survey.questions, function(question) {
      return (question.questionId == questionId);
    })
    
    if (theQuestion) {
      result = theQuestion.type;
    }
  } else {
    console.log('(warning) gqtfi: can\'t get survey questions for some reason');
  }
  
  return result;
}

/*
  Get an array of answers corresponding to the question number

  Lovely exponential order (O2) algorithm here.
  
  May want to look into process.nextTick().  It seems to be kind of like a ".DoEvents()"
  
 */
var getSurveyAnswersforQuestionId = exports.getSurveyAnswersforQuestionId = function(answers, questionId) {
  var result = [];

  _.each(answers.responses, function(response) {
    result.push(_.find(response.answers, function(answer) {
      return answer.question_id == questionId;
    }));
  });
  
  return result;
}

var convertSummaryToLabelValues = exports.convertSummaryToLabelValues = function(summary) {
  var result = [];
  
  if (summary && 
    summary.labels &&
    summary.labels.length > 0 &&
    summary.datasets && 
    summary.datasets.length > 0 &&
    summary.datasets[0].data &&
    summary.datasets[0].data.length > 0) {
    
    _.each(summary.datasets[0].data, function(dataItem, index) {
      result.push({ label: summary.labels[index], value: dataItem });
    })
  } else {
    console.log('(warning) cstlv: the summary to convert is missing something');
  }
  
  return result;
}

/*
  Build the expected response to the front end for the particular question from the survey.
 */
var buildResponseForQuestionId = exports.buildResponseForQuestionId = function(survey, answers, questionId) {
  
  var type = getQuestionTypeForId(survey, questionId);
  var answers = getSurveyAnswersforQuestionId(answers, questionId);
  
  var result = {
    type: type,
    datapoints: []
  }
  
  switch (type) {
    case 'multichoice':
    case 'scale_1to5':
    case 'freeform':

      var options = {
        getKey: function(item) {
          return item.answer;
        },
        getDescription: function(item) {
          return item.answer;
        }
      }
      
      var temp = dataSummaryFromItems(answers, options);
      result.datapoints = convertSummaryToLabelValues(temp);

      break;
      
    default:
      throw 'unsupported question type: ' + type + 
        ' for question id: ' + questionId + 
        ' for survey id: '+  survey.uuid;
      
  }
  return result;
} 

/*
  Get event analytics data from the database and return it to the client
  todo: break this beast down into small testable units
 */
exports.eventAnalyticsData = function(req, res) {

  var type = req.query.type;
  
  //
  // Function that can return our required data
  //
  var dataRetreiver;
  
  var eventId = req.params.eventId;
  
  var done = function(err, data) {
    if (err) {

      var statusCode = err.statusCode || 500;
      var statusMsg = err.statusMsg || 'Unknown error';
      
      res.send(statusCode, { msg: statusMsg });
      
    } else {

      res.send(200, data);
    }
  };

  
  switch(type) {
    case 'totalCheckins':

      eventManager.getEventUsersCounts(eventId, function(err, results) {
        if (err) {
          done(err);
        } else {
          var data = {
            datapoints: results.checkins
          }
          done(null, data);
        }
      });

      break;

    case 'contaggsExchanged':

      eventManager.getEventTotalContaggs(eventId, function(err, results) {
        if (err) {
          done(err);
        } else {
          var data = {
            datapoints: results.contaggs
          }
          done(null, data);
        }
      })

      break;

    case 'checkinTimeSummary':
      // Note: not called by front end.  todo: when there's time.
      var data = {
        labels: ['5pm', '6pm', '7pm', '8pm', '9pm'],
        datasets: [
          {
            data: [7, 10, 20, 15, 11]
          }
        ]
      }

      done(undefined, data);
      break;
    
    case 'companySummary':
      
      async.waterfall([
        function(cb) {
          userManager.getEventUsers(eventId, 'checkedin', cb);
        },
        function(userIds, cb) {
          //
          // May want to consider paging this if the user list is big
          //
          var uids = _.map(userIds, function(uid) { return { uuid: uid.userId }});
          
          userManager.populateUserContaggs(uids, function(populatedUsers) {
            cb(null, populatedUsers);
          })
        },
        function(users, cb) {
          var result = companySummaryFromUsers(users);
          cb(null, result);
        }
      ], done)
      
      break;


    case 'titlesSummary':

      //
      // Crap, this is not DRY at all.  It repeats a lot of the above code.
      // todo: Let's see if we can rewrite, and cache too.
      //
      async.waterfall([
        function(cb) {
          userManager.getEventUsers(eventId, 'checkedin', cb);
        },
        function(userIds, cb) {
          //
          // May want to consider paging this if the user list is big
          //
          var uids = _.map(userIds, function(uid) { return { uuid: uid.userId }});

          userManager.populateUserContaggs(uids, function(populatedUsers) {
            cb(null, populatedUsers);
          })
        },
        function(users, cb) {
          var result = jobTitleSummaryFromUsers(users);
          cb(null, result);
        }
      ], done)

      break;

    default:
      
      var surveyQuestionNumber = thisModule.getSurveyQuestionNumberFromString(type);
      
      if (surveyQuestionNumber) {
        
        // Get data from the db
        async.waterfall([
          function(cb) {
            eventManager.getSurveyByEventId(eventId, cb);
          },
          function(survey, cb) {
            var surveyId = survey.uuid;
            eventManager.getEventSurveyAnswers(surveyId, function(err, answers) {
              cb(err, survey, answers);
            });
          }
        ], 
        function(err, survey, answers) {

          var data = buildResponseForQuestionId(survey, answers, surveyQuestionNumber);
          done(err, data);
        })
      } else {

        done({ statusCode: 404, statusMsg: 'Unknown type: ' + type} );
      }
  }
}

/*
  Return list of users for the event
 */
exports.usersList = function(req, res) {
  
  // console.log('event: ' + req.params.id + ', type: ' + req.query.type);
  // todo: add some unit testing for this stuff, prolly the API call at least
  //
  // Let's do some tasks
  //
  var eventId = req.params.id;
  var isEventOwner = false;
  
  async.waterfall([
    function(cb) {
      if (!req.query.type) {
        
        cb({ status: 400, msg: 'Missing \'type\' parameter.' });
      } else {
        
        cb(null, req.query.type)
      }
    },
    function(type, cb) {
      //
      // Let's look up the event and find out who the owner is
      //
      eventManager.getEvent(eventId, function(err, event) {

        if (err) {
          cb({ status: 500, msg: err});
          
        } else {
          
          // todo: SocialTagg F2F 10/2013.  Can remove after dev complete on events page.
          var isSpecialEvent = eventId === 'be1b65e0-3e71-11e3-a797-1399e22b12e3';
          isEventOwner = isSpecialEvent || event.owner === application.getCurrentSessionUserId(req);
          
          // http://development.socialtagg.com:3000/events/be1b65e0-3e71-11e3-a797-1399e22b12e3
          
          cb(null, type);
        }
      });
    },
    function(type, cb) {

      switch (type) {
        case 'checkedin':
        case 'registered':

          userManager.getEventUsers(eventId, type, function(err, result) {
            if (err) {
              cb({ status: 500, msg: err });
            } else {
              
              //
              // Let's build a list of users
              //
              var iterator = function(item, callback) {
                
                userManager.getUser(item.userId, function(user) {
                  
                  if (user) {
                    item.user = user;
                  }
                  callback();
                })
              }
              
              async.each(result, iterator, function(err) {
                if (err) {
                  cb(err);
                } else {
                  cb(null, result);
                } 
              });
            }
          });
          break;
        default: 
          cb({ status: 400, msg: 'Unknown type: ' + type });
      }
    }
  ], function(err, result) {
    
    if (err) {
      res.send(err.status, { msg: err.msg });
      
    } else {
      //
      // need to filter our user objects for privacy if it's not an event owner.  Otherwise,
      // pass the usual object back.
      //
      var users = _.map(result, function(user) {
        var result
        
        if (isEventOwner) {
          result = user.user;
        } else {
          result = {
            pictureUrl: user.user.pictureUrl,
            firstName: user.user.firstName
          };
        }
        
        return result;
      });
      
      res.send(200, users);
    }
  });
  
}