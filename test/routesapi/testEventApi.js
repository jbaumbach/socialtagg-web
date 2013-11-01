/**
 * User: jbaumbach
 * Date: 8/3/13
 * Time: 3:50 PM
 */

var assert = require('assert')
  , util = require('util')
  , eventapi = require('../../routesapi/eventapi')
  , Event = require('../../models/Event')
  , _ = require('underscore')
  , User = require(process.cwd() + '/models/User')
  , sinon = require('sinon')
  ;

describe('Event API', function() {

  this.timeout(9000);

  it('should validate a blank raw event', function() {
    
    var eventRaw = {};
    
    var msgs = eventapi.validateRawEventAndConvertDates(eventRaw);
    
    assert.ok(_.find(msgs, function(msg) { return msg === 'the event owner is not present' }), 'didn\'t check for event owner');
    assert.ok(_.find(msgs, function(msg) { return msg === 'name should be between 1 and 100 chars'; }), 'didn\'t check for name empty');
    assert.ok(_.find(msgs, function(msg) { return msg === 'description should not be blank'}), 'didn\'t check for blank description');
    assert.ok(_.find(msgs, function(msg) { return msg === 'address should not be blank'}), 'didn\'t check for blank address');
    assert.ok(_.find(msgs, function(msg) { return msg === 'start date or time is blank or invalid'}), 'didn\'t check date for blank');
    assert.ok(_.find(msgs, function(msg) { return msg === 'end date or time is blank or invalid'}), 'didn\'t check for end date');
    assert.ok(_.find(msgs, function(msg) { return msg === 'timezone is not set or invalid'}), 'didn\'t check for timezone');
    
  });
  
  it('should validate a good raw event', function() {
    
    var goodEvent = {
      owner: '123456',
      name: 'my event',
      description: 'my sample description',
      address: '1234 Tattoine St.',
      startDate: '2/2/2013',
      startTime: '2:34:56 PM',
      endDate: '2/2/2013', 
      endTime: '5:00 AM',
      timezoneOffset: -7, // CST
      checkinPeriodStartTimeMins: 15,
      website: 'http://www.holycrap.com'
    };

    var msgs = eventapi.validateRawEventAndConvertDates(goodEvent);
    
    assert.equal(msgs.length, 0, 'huh, a property got rejected: ' + msgs[0]);
    
    // Check the date parsing and conversion that the validation module does
    
    var startDateTime = 1359840896000; // or Sat Feb 02 2013 13:34:56 GMT-0800 (PST)
    var endDateTime = 1359806400000 // or Sat Feb 02 2013 04:00:00 GMT-0800 (PST)
     
    assert.equal(goodEvent.startDate, startDateTime, 'didn\'t replace startDate with correct datetime');
    assert.equal(goodEvent.endDate, endDateTime, 'didn\'t replace endDate with correct datetime');
    
    
  });
  
  it('should validate various bad properties', function() {

    var goodEvent = {
      owner: '123456',
      name: 'my event',
      description: 'my sample description',
      address: '1234 Tattoine St.',
      startDate: '2/2/2013',
      startTime: '1:00 PM',
      endDate: '2/2/2013',
      endTime: '5:00 PM',
      timezoneOffset: -8, // PST
      checkinPeriodStartTimeMins: 15,
      website: 'http://www.holycrap.com'
    };

    var badName = goodEvent;
    badName.name = '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789X';
    
    var msgs = eventapi.validateRawEventAndConvertDates(badName);
    
    assert.ok(_.find(msgs, function(msg) { return msg === 'name should be between 1 and 100 chars'}), 'allowed 101 chars');
    
    var badDates = goodEvent;
    badDates.startDate = 'silly start date';
    badDates.endDate = 'crappy end date';
    
    msgs = eventapi.validateRawEventAndConvertDates(badDates);
    
    assert.ok(_.find(msgs, function(msg) { return msg === 'start date or time is blank or invalid'}), 'bad start date accepted');
    assert.ok(_.find(msgs, function(msg) { return msg === 'end date or time is blank or invalid'}), 'bad end date accepted');
    
  });
  
  
  it('should handle a timezoneOffset passed as string', function() {

    var goodEvent = {
      owner: '123456',
      name: 'my event',
      description: 'my sample description',
      address: '1234 Tattoine St.',
      startDate: '2/2/2013',
      startTime: '1:00 PM',
      endDate: '2/2/2013',
      endTime: '5:00 PM',
      timezoneOffset: '-8', // PST
      checkinPeriodStartTimeMins: 15,
      website: 'http://www.holycrap.com'
    };

    var msgs = eventapi.validateRawEventAndConvertDates(goodEvent);

    assert.equal(msgs.length, 0, 'huh, a property got rejected: ' + msgs[0]);
  });
  
  
  describe('Survey section', function() {
    
    it('should validate a blank survey', function() {
      
      var raw = {};
      
      var msgs = eventapi.validateRawSurvey(raw);

      // This is more of a sanity check.  It can be varied.
      assert.equal(msgs.length, 2, 'didn\'t get back 2 validation msgs');
      
      assert.ok(_.find(msgs, function(msg) { return msg === 'when to show type not selected'}), 'empty survey accepted');
      assert.ok(_.find(msgs, function(msg) { return msg === 'please enter at least 1 survey question'}), 'empty survey accepted');
    });
    
    it('should reject bad whenToShowType value', function() {
       
      var s = {
        whenToShowType: 'uggabugga'
      } 
      
      var msgs = eventapi.validateRawSurvey(s);
      
      assert.ok(_.find(msgs, function(msg) { return msg === 'survey "when to show type" is not valid'}), 'invalid type selected');
    });
    
    it('should require number of minutes for type showAfterXMins', function() {

      var s = {
        whenToShowType: 'showAfterXMins'
      }
      
      var msgs = eventapi.validateRawSurvey(s);
      
      assert.ok(_.find(msgs, function(msg) { return msg === 'enter valid number of minutes to show survey'}), 'let it through');
      
      s.whentoShowMins = 'blah';

      msgs = eventapi.validateRawSurvey(s);

      assert.ok(_.find(msgs, function(msg) { return msg === 'enter valid number of minutes to show survey'}), 'let it through');

      s.whentoShowMins = 5;

      msgs = eventapi.validateRawSurvey(s);

      assert.ok(!_.find(msgs, function(msg) { return msg === 'enter valid number of minutes to show survey'}), 'let it through');

    });
    
    it('should validate that survey questions have text', function() {
      
      var s = {
        whenToShowType: 'showOnCheckin',
        questions: [ 'yoda' ]
      }
      
      var msgs = eventapi.validateRawSurvey(s);
      
      assert.ok(_.find(msgs, function(msg) { return msg === 'please enter some text for question 1'}), 'allowed question w/no text');
      
      s.questions = [
        { text: 'yoda' },
        'uggabugga'
      ];
      
      msgs = eventapi.validateRawSurvey(s);

      assert.ok(_.find(msgs, function(msg) { return msg === 'please enter a valid type for question 1'}), 'allowed no type for question 1');
      assert.ok(_.find(msgs, function(msg) { return msg === 'please enter some text for question 2'}), 'allowed question 2 w/no text');
      
    });

    it('should validate question type', function() {
      var s = {
        whenToShowType: 'showOnCheckin',
        questions: [
          { text: 'yoda', type: 'uggabugga' }
        ]
      };

      var msgs = eventapi.validateRawSurvey(s);

      assert.ok(_.find(msgs, function(msg) { return msg === 'please enter a valid type for question 1'}), 'allowed question 1 w/a bad type');

    })

    it('should make sure multichoice questions have at least two answers', function() {

      var s = {
        whenToShowType: 'showOnCheckin',
        questions: [
          { text: 'yoda', type: 'multichoice' }
        ]
      };

      var msgs = eventapi.validateRawSurvey(s);

      assert.ok(_.find(msgs, function(msg) { return msg === 'please enter at least two options for multiple choice question 1'}), 'allowed multichoice questions with 0 answers');
      
      s.questions[0].choices = [ 'luke' ];

      msgs = eventapi.validateRawSurvey(s);

      assert.ok(_.find(msgs, function(msg) { return msg === 'please enter at least two options for multiple choice question 1'}), 'allowed multichoice questions with 1 answer');

      s.questions[0].choices.push('darth');
      
      msgs = eventapi.validateRawSurvey(s);
      
      assert.equal(msgs.length, 0, 'huh, got validation errors');
      
      s.questions[0].choices.push('');
      
      msgs = eventapi.validateRawSurvey(s);
      
      assert.ok(_.find(msgs, function(msg) { return msg === 'please enter some text for choice 3 of question 1'}), 'allowed multichoice answer that was blank');
      assert.equal(msgs.length, 1, 'got too many validation errors');
      
    });
    
    it('should validate a good small survey', function() {
      var s = {
        whenToShowType: 'showOnCheckin',
        questions: [
          { text: 'yoda', type: 'scale_1to5' },
          { text: 'obiwan', type: 'multichoice', choices: [ 'han', 'solo'] }
        ]
      };
      
      var msgs = eventapi.validateRawSurvey(s);
      
      assert.ok(!msgs || msgs.length == 0, 'huh, got errors');

    })
    
  });

  it('should return 404 for analytics data if bad type', function(done) {

    //
    // This function may time out if there's an error
    //
    var steps = { calledSend: false };

    function quitIfDone() {
      var outtaHere = steps.calledSend;

      if (outtaHere) {
        done();
      } else {
        console.log('not done yet...');
      }
    }

    var req = { query: { type: 'checkinTimeSummaryxxx' }, params: { eventId: 'hello' } };

    var res = {
      send: function(code, data) {
        steps.calledSend = true;
        assert.equal(code, 404, 'didn\'t get right status code');

        quitIfDone();
      }
    }

    eventapi.eventAnalyticsData(req, res);
  });


  it('should return analytics data for checkinTimeSummary', function(done) {

    //
    // This function may time out if there's an error
    //
    var steps = { calledSend: false };

    function quitIfDone() {
      var outtaHere = steps.calledSend;
      
      if (outtaHere) {
        done();
      } else {
        console.log('not done yet...');
      }
    }

    // todo: make this an array and call all the funcs in a loop
    
    var req = { query: { type: 'checkinTimeSummary' }, params: { eventId: 'hello' } };

    var res = {
      send: function(code, data) {
        steps.calledSend = true;
        assert.equal(code, 200, 'didn\'t get right status code');
        assert.ok(data, 'didn\'t get any data!');
        assert.ok(data.labels, 'didnt get data labels');

        quitIfDone();
      }
    }

    eventapi.eventAnalyticsData(req, res);
  });

  it('should be able to get a survey question number from a text description', function() {
    
    var e = '12';
    var t = 'sq-' + e;
    
    var r = eventapi.getSurveyQuestionNumberFromString(t);
    assert.equal(r, e, 'didn\'t get right number');
    
  });
  
  it('should grab some checked in people from an event', function(done) {

    var req = {
      query: {
        type: 'checkedin'
      },
      params: {
        id: '2ad0769a-2abc-11e3-8462-4b5f96a08764'  // Louis' event
      }
    }
    
    var res = {
      send: function(code, data) {
        assert.equal(code, 200, 'didn\'t get right status code');
        assert.ok(data.length > 0, 'didn\'t get multiple checkins back');
        assert.ok(data[0].pictureUrl, 'didn\'t get a pic back');
        
        done();
      }
    }
    
    eventapi.usersList(req, res);
    
  });
  
  it('should bomb gracefully looking for checked in people from an event with wrong type', function(done) {

    var req = {
      query: {
        type: 'nowaydoesthisexist'
      },
      params: {
        id: '2ad0769a-2abc-11e3-8462-4b5f96a08764'  // Louis' event
      }
    }

    var res = {
      send: function(code, data) {
        assert.equal(code, 400, 'didn\'t get right status code');
        assert.ok(data.msg.match(/unknown type/i), 'didn\'t get right error message');

        done();
      }
    }

    eventapi.usersList(req, res);

  });
  
  it('should tabulate user companies properly', function() {

    /*
     data = {
     labels: ['Microsoft', 'Google', 'Facebook', 'SocialTagg'],
     datasets: [
     {
     data: [75, 60, 45, 12]
     }]
     }

     done(undefined, data);
     */

    var users = [
      new User({ company: 'Google' }),
      new User({ company: 'SocialTagg' }),
      new User({ company: 'Social Tagg' }),
      new User(),
      new User({ company: 'google' }),
      new User({ company: 'social-tagg' })
    ]
    
    var r = eventapi.companySummaryFromUsers(users);
    
    assert.equal(r.labels[0], 'SocialTagg', 'didn\'t get socialtagg');
    assert.equal(r.labels[1], 'Google', 'didn\'t get google');
    
    assert.equal(r.datasets[0].data[0], 3, 'didn\'t count socialtagg properly');
    assert.equal(r.datasets[0].data[1], 2, 'didn\'t count google properly');
    
  })
  
  it('should not bomb tabulating user companies if there are no users', function() {
    
    var r = eventapi.companySummaryFromUsers();
    
    assert.ok(r, 'didn\'t get back an empty object!');
  })


  it('should grab the question type for a survey question of a given question id', function() {
    var survey = { uuid: '6920504a-1e4c-11e3-8208-696c32c76c87',
      eventId: 'd295e83a-0f8a-11e3-a682-2346c22487a2',
      isAnonymous: true,
      whenToShowType: 'showAfterXMins',
      whentoShowMins: '10',
      inactiveInd: false,
      questions:
        [ { choices:
          [ 'The ice sculpture',
            'The open bar',
            'The live band',
            'None of the above' ],
          text: 'What was the best feature?',
          type: 'multichoice',
          questionId: 1 },
          { text: 'How would you rank this event?',
            type: 'scale_1to5',
            questionId: 2 },
          { text: 'What would you change for next time?',
            type: 'freeform',
            questionId: 3 } ] }

    //
    // Should work with both a string questionId and an int questionId
    //
    var r = eventapi.getQuestionTypeForId(survey, 1);
    assert.equal(r, 'multichoice', 'didn\'t get multichoice');

    r = eventapi.getQuestionTypeForId(survey, '3');
    assert.equal(r, 'freeform', 'didn\'t get freeform');

    r = eventapi.getQuestionTypeForId(survey, 334);
    assert.ok(!r, 'got something other than undefined back for bogus id');


  })

  var stf2fSurvey = { uuid: '0c27ddea-3e72-11e3-9f08-f793b2f20cbe',
    eventId: 'be1b65e0-3e71-11e3-a797-1399e22b12e3',
    isAnonymous: true,
    whenToShowType: 'showOnCheckin',
    whentoShowMins: undefined,
    inactiveInd: false,
    questions:
      [ { text: 'On a scale of 1-5, how would you rate your experience with SocialTagg?',
        type: 'scale_1to5',
        questionId: 1,
        description: 'Scale of 1 to 5' },
        { text: 'Where did you experience pain points?',
          type: 'freeform',
          questionId: 2,
          description: 'Freeform Input' } ] }
  
  var stf2fAnswers = { responses:
    [ { user: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8',
      created: 1382818410532,
      answers:
        [ { answer: '5', question_id: '1' },
          { answer: 'checking in', question_id: '2' } ] },
      { user: 'c238c31a-2d6a-11e3-898d-85fbe15c5ce8',
        created: 1382818491982,
        answers:
          [ { answer: '5', question_id: '1' },
            { answer: 'is the guestlist secure?', question_id: '2' } ] },
      { user: '5b07c30a-082e-11e3-b923-dbfd8bf6ac23',
        created: 1382818785873,
        answers:
          [ { answer: '5', question_id: '1' },
            { answer: 'checking in', question_id: '2' } ] },
      { user: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc',
        created: 1382819748540,
        answers:
          [ { created: 1382843867692,
            uuid: '20abbc55-49a8-4707-b25b-b0f9ed5deb03',
            modified: 1382844947808,
            answer: '4',
            question_id: '1' },
            { created: 1382843867692,
              uuid: '97a42d20-1b70-4601-96a0-06ca25a1cc19',
              modified: 1382844947809,
              answer: 'Installing the beta iOS app was a pain. Otherwise, all good. ',
              question_id: '2' } ] },
      { user: 'f4dbf1b1-bc70-11e2-a65f-02e81afcd5fc',
        created: 1382825249655,
        answers:
          [ { answer: '5', question_id: '1' },
            { answer: 'Tim\'s face', question_id: '2' } ] },
      { user: 'f4dbf1b1-bc70-11e2-a65f-02e81afcd5fc',
        created: 1382825282645,
        answers:
          [ { answer: '5', question_id: '1' },
            { answer: 'hfd', question_id: '2' } ] },
      { user: 'd31fb37f-7428-11e2-a3b3-02e81adcf3d0',
        created: 1382827174978,
        answers:
          [ { created: 1382852294055,
            uuid: 'fbb8e432-c4d3-4e2c-a8ab-0ffa86e9766e',
            modified: 1382852416828,
            answer: '4',
            question_id: '1' },
            { created: 1382852294055,
              uuid: 'ad79e312-3289-4ea9-a17b-b4cfa2cd83a4',
              modified: 1382852416829,
              answer: 'Loud people outside. Hehehe',
              question_id: '2' } ] },
      { user: '3d86497b-66c4-11e2-8b37-02e81ac5a17b',
        created: 1382890251583,
        answers:
          [ { created: 1382844833750,
            uuid: 'cc6284a0-6b5f-4e77-be93-c7d79154df26',
            modified: 1382915450010,
            answer: 'The date of this event was correct but the time was wrong. Please fix.',
            question_id: '2' },
            { created: 1382844954200,
              uuid: '4ad6e3cc-3569-4445-b270-c46875d18f7e',
              modified: 1382915450010,
              answer: '5',
              question_id: '1' } ] } ] }
  
  it('should get answers for a survey', function() {

    var r = eventapi.getSurveyAnswersforQuestionId(stf2fAnswers, 1);
    assert.equal(r.length, 8, 'didn\'t get all the answers back (got ' + r.length + ')');
  })
  
  it('should convert a summary result to a labe/values result', function() {
    var d = { labels: [ '5', '4' ], datasets: [ { data: [ 6, 2 ] } ] };
    
    var r = eventapi.convertSummaryToLabelValues(d);
    
    assert.ok(r.length == 2, 'didn\'t get em all back');
    assert.equal(r[1].label, '4', 'didn\'t get 4 as the second item');
    
  })
  
  it('should get response answers for a survey', function() {
    
    var r = eventapi.buildResponseForQuestionId(stf2fSurvey, stf2fAnswers, 1);
    
    console.log('** survey for 1: ' + util.inspect(r, { depth: null}));
    
    assert.equal(r.type, 'scale_1to5', 'didn\'t get the right type back');
    assert.equal(r.datapoints[0].label, '5', 'didn\'t get 5 as the first one in data points');
    assert.equal(r.datapoints[1].value, 2, 'didn\'t get back 2 as the second number of responses');
    
  })
  
  it('should get and process events users counts ok for no contaggs', function(done) {
    var eventId = 'b9a9138a-4296-11e3-af47-51a116293e74';  // JBs unit test event - don't change 

    eventapi.getAndProcessEventContaggsCounts(eventId, function(err, result) {
      
      assert.ok(result);
      assert.ok(!err);
      assert.equal(result.contaggs, 0);
      
      done();
    })
  })

  it('should get and process events users counts ok for some contaggs', function(done) {
    
    var eventId = 'be1b65e0-3e71-11e3-a797-1399e22b12e3';   // ST F2F 

    eventapi.getAndProcessEventContaggsCounts(eventId, function(err, result) {

      assert.ok(result);
      assert.ok(!err);
      assert.equal(result.contaggs, 13);

      done();
    })
  })

});
    
    
