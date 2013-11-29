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

  it('should get an event summary from a list of "lite" event objects', function() {

    var r = eventapi.getEventSummary(null, events);

    var uno = r['32'];
    assert.equal(uno.week, 32, 'didn\'t get right week');
    assert.equal(uno.eventCount, 7, 'didn\'t get right count for week');
    //assert.equal(uno.desc, 'Week of Monday, August 5th 2013', 'didn\'t get right desc');
    assert.ok(uno.desc.match(/Week of/i), 'didn\'t get right desc');
  })

});

//*************** Event Data **********************

var events = [ { id: '42e60bfa-fd80-11e2-b3fe-3df7a1a1c275',
  created: 1375673809455,
  owner: 'ea10dde9-8a1b-11e2-b0a7-02e81ac5a17b' },
  { id: 'd4a1d54a-011a-11e3-a69c-7756be5133e5',
    created: 1376070049940,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '6a04d32a-011c-11e3-bb49-cb9db10ef150',
    created: 1376070730066,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '00a15b1a-0121-11e3-ad7d-1512262bb401',
    created: 1376072700737,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '21faa5fa-0121-11e3-bef1-a3c4dbe2cd22',
    created: 1376072756687,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '7fb90fba-0121-11e3-9a46-cb975634f0cd',
    created: 1376072913963,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: 'e5daed5a-0148-11e3-bafa-55f399b07ac5',
    created: 1376089835685,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '2764cd5a-02c4-11e3-aee2-2105e14abc45',
    created: 1376252724901,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: 'c803e1ba-02c4-11e3-b66b-07e85116f58c',
    created: 1376252994379,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: 'bd3e3f70-0551-11e3-88a3-6dff2007a4b2',
    created: 1376533437670,
    owner: '420f013a-03f4-11e3-851f-a93a57d20d81' },
  { id: 'd295e83a-0f8a-11e3-a682-2346c22487a2',
    created: 1377657466419,
    owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' },
  { id: '07a8d61a-106a-11e3-bbff-79d1d3a5cafe',
    created: 1377753333233,
    owner: '7d6029fa-1027-11e3-bbbe-3f9c3726ead0' },
  { id: '9e3743da-1198-11e3-8285-05412f8bb912',
    created: 1377883293837,
    owner: '1bf34bfa-07c8-11e3-af5c-51a7c0a13fad' },
  { id: '63e9beba-11b6-11e3-9aeb-41d0ac686e7a',
    created: 1377896080923,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: 'eb3412da-1675-11e3-9bfc-b580a59b4abf',
    created: 1378418146429,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '850e805a-18ee-11e3-9efa-2f9eb2d8c954',
    created: 1378689846485,
    owner: undefined },
  { id: '6e3ed3ca-1dee-11e3-9702-57a3de3eed68',
    created: 1379239564028,
    owner: 'f4dbf1b1-bc70-11e2-a65f-02e81afcd5fc' },
  { id: '5c33c730-1ee8-11e3-b9b7-7fe8d8b0aff7',
    created: 1379346907938,
    owner: '9c1f4cda-e2d3-11e2-a4b4-3ba51af19848' },
  { id: 'b3c239fa-2316-11e3-9f16-9702fb856389',
    created: 1379806616335,
    owner: '5b07c30a-082e-11e3-b923-dbfd8bf6ac23' },
  { id: '99379eb4-23ec-11e3-96d4-69e15facb120',
    created: 1379898484106,
    owner: 'd31fb37f-7428-11e2-a3b3-02e81adcf3d0' },
  { id: '2ad0769a-2abc-11e3-8462-4b5f96a08764',
    created: 1380647341177,
    owner: '5b07c30a-082e-11e3-b923-dbfd8bf6ac23' },
  { id: '08cfd34a-2b2c-11e3-9f29-9b78ccb341c4',
    created: 1380695387764,
    owner: '532cc7a6-7679-11e2-96f4-02e81ac5a17b' },
  { id: '1019ca7a-2f7d-11e3-998c-c39b994df13d',
    created: 1381169993879,
    owner: '71ebee1a-1bfd-11e3-98e1-3d6c4df5db3f' },
  { id: '5c935f4a-2ff2-11e3-8997-05c3745a7888',
    created: 1381220373300,
    owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' },
  { id: '87dfdf2a-30b0-11e3-9a67-dfd0bd1849e3',
    created: 1381302050322,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: '3ee0f17a-3154-11e3-b985-c3118d3f1260',
    created: 1381372365319,
    owner: '5b07c30a-082e-11e3-b923-dbfd8bf6ac23' },
  { id: '7f4331ba-321c-11e3-bdd7-c50d94e05621',
    created: 1381458372683,
    owner: 'd31fb37f-7428-11e2-a3b3-02e81adcf3d0' },
  { id: 'a0147e8a-34a6-11e3-9ba1-658c110499ea',
    created: 1381737600616,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: 'f8a0709a-3e65-11e3-a1c0-e38b76c5f6b7',
    created: 1382809343513,
    owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' },
  { id: 'be1b65e0-3e71-11e3-a797-1399e22b12e3',
    created: 1382814399293,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: '09b4777a-3e73-11e3-9488-073c98762a1b',
    created: 1382814955623,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: '0b0904ca-3e90-11e3-9bb1-25725ea691e8',
    created: 1382827413260,
    owner: 'c238c31a-2d6a-11e3-898d-85fbe15c5ce8' },
  { id: '33da9bfa-41f3-11e3-aebe-afafcac6105d',
    created: 1383199855407,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: '8a82d8ea-41f9-11e3-8ec4-c55af1241766',
    created: 1383202577774,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: 'd4a3beda-41f9-11e3-a4d6-c546299941f2',
    created: 1383202702141,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: 'b9a9138a-4296-11e3-af47-51a116293e74',
    created: 1383270087864,
    owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' },
  { id: '81b78c4a-4363-11e3-9756-4d4631741937',
    created: 1383358040836,
    owner: 'f4dbf1b1-bc70-11e2-a65f-02e81afcd5fc' },
  { id: 'd87ddcfa-4534-11e3-8906-bf61e7eefd9c',
    created: 1383557902399,
    owner: '3d86497b-66c4-11e2-8b37-02e81ac5a17b' },
  { id: 'b08280aa-4536-11e3-8b28-e92264aafa1d',
    created: 1383558694314,
    owner: '3d86497b-66c4-11e2-8b37-02e81ac5a17b' },
  { id: '96dd7dba-4538-11e3-adfb-910f327f470d',
    created: 1383559510283,
    owner: '3d86497b-66c4-11e2-8b37-02e81ac5a17b' },
  { id: 'ae3afa0a-45d8-11e3-b272-ad2551ac4aa0',
    created: 1383628268960,
    owner: 'c238c31a-2d6a-11e3-898d-85fbe15c5ce8' },
  { id: '5e80600a-45dc-11e3-a789-6567af4381ec',
    created: 1383629853184,
    owner: 'c238c31a-2d6a-11e3-898d-85fbe15c5ce8' },
  { id: '4527c80a-45e1-11e3-81ea-65de4009c8b3',
    created: 1383631958144,
    owner: 'c238c31a-2d6a-11e3-898d-85fbe15c5ce8' },
  { id: '093db34a-45e6-11e3-a525-c9c8b8fa0ad5',
    created: 1383634005108,
    owner: 'c238c31a-2d6a-11e3-898d-85fbe15c5ce8' },
  { id: '66d2bdda-46bc-11e3-9529-0df724b935c8',
    created: 1383726074413,
    owner: '5893116a-275a-11e3-be34-f9ef93e2dea2' },
  { id: '1d8c83aa-46c0-11e3-a47f-f9c0ed61ed7e',
    created: 1383727669466,
    owner: 'f4dbf1b1-bc70-11e2-a65f-02e81afcd5fc' },
  { id: '50e05b4a-46c1-11e3-b15c-9b016b435c25',
    created: 1383728185076,
    owner: 'f4dbf1b1-bc70-11e2-a65f-02e81afcd5fc' },
  { id: 'e4238b5a-474f-11e3-8683-9f5dedb3d8c0',
    created: 1383789420677,
    owner: 'f4dbf1b1-bc70-11e2-a65f-02e81afcd5fc' },
  { id: 'fd15146a-475b-11e3-afa8-edb36ba8fef5',
    created: 1383794616486,
    owner: '5b07c30a-082e-11e3-b923-dbfd8bf6ac23' },
  { id: '34db480a-49d3-11e3-a65c-9ff9b45cac9e',
    created: 1384065722496,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: 'c80bf20a-49d3-11e3-8936-13b4de80a7da',
    created: 1384065969440,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: 'd1c3ab1a-49d5-11e3-8efa-8be2b967bb03',
    created: 1384066844737,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '7fc5267a-49d7-11e3-88d3-09c31ac863a1',
    created: 1384067566167,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '55e09b8a-4a4c-11e3-86b4-278d2415262f',
    created: 1384117747000,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: 'a7ebed6a-4a76-11e3-8798-13c4539a52c5',
    created: 1384135923510,
    owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' },
  { id: '94ec5daa-4a7e-11e3-bb78-9ffec014e318',
    created: 1384139327610,
    owner: 'd31fb37f-7428-11e2-a3b3-02e81adcf3d0' },
  { id: 'ef01476a-4a7e-11e3-951b-638cf25b2ba8',
    created: 1384139478742,
    owner: 'd31fb37f-7428-11e2-a3b3-02e81adcf3d0' },
  { id: '57f65fba-4a9a-11e3-8ae1-a53f7c337152',
    created: 1384151251243,
    owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' },
  { id: 'ca73312a-4a9b-11e3-af7d-19baef1f4599',
    created: 1384151872818,
    owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' },
  { id: 'fb2f3b5a-4aa6-11e3-81de-39169fc5e5e3',
    created: 1384156679045,
    owner: '3d86497b-66c4-11e2-8b37-02e81ac5a17b' },
  { id: '282697fa-4b58-11e3-a9df-d78c252cf4b9',
    created: 1384232775407,
    owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' },
  { id: '14f3cdc0-4b61-11e3-824b-016b07cb273a',
    created: 1384236608667,
    owner: 'b66a00ee-73d3-11e2-95c4-02e81ae640dc' },
  { id: '31298894-4b71-11e3-a500-2320b6c8a9fa',
    created: 1384243527944,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: '8b94a89a-4b71-11e3-adf4-39ebcd73429f',
    created: 1384243679641,
    owner: 'd31fb37f-7428-11e2-a3b3-02e81adcf3d0' },
  { id: '2bdcd63a-4c29-11e3-97ca-b5a8333e0701',
    created: 1384322546451,
    owner: '3d86497b-66c4-11e2-8b37-02e81ac5a17b' },
  { id: '9d52084a-4dc2-11e3-9c27-d1b7895639a1',
    created: 1384498400964,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: '400fb6f4-4dc3-11e3-8942-93818bb4748a',
    created: 1384498673998,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '65691404-4dc8-11e3-84e5-d35920755594',
    created: 1384500884143,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '835ffa04-4dc8-11e3-895a-edfc20feaf37',
    created: 1384500934415,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: 'd6cdfada-4dcb-11e3-82bd-eb88aa5ba3d0',
    created: 1384502362877,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '387e6e6a-4e10-11e3-a4c9-f3bee11f1ce9',
    created: 1384531732550,
    owner: 'b31e92da-4c8a-11e3-8e0d-213c6a3c1b66' },
  { id: '72b7128a-4e1f-11e3-9eea-0373d6f182e1',
    created: 1384538272680,
    owner: 'b31e92da-4c8a-11e3-8e0d-213c6a3c1b66' },
  { id: '3a1547ca-4e20-11e3-81f7-35a1f81c8f33',
    created: 1384538607164,
    owner: 'b31e92da-4c8a-11e3-8e0d-213c6a3c1b66' },
  { id: '4d33626a-4e20-11e3-b638-af389b70ce0f',
    created: 1384538639238,
    owner: 'b31e92da-4c8a-11e3-8e0d-213c6a3c1b66' },
  { id: '6a4d55ea-4e20-11e3-8c5c-0bfc809184f9',
    created: 1384538688062,
    owner: 'b31e92da-4c8a-11e3-8e0d-213c6a3c1b66' },
  { id: 'ce9c0bea-4e20-11e3-a661-d3fcdd4a8a59',
    created: 1384538856350,
    owner: 'b31e92da-4c8a-11e3-8e0d-213c6a3c1b66' },
  { id: '8bcbd09a-4f13-11e3-a98d-3b7f276791cf',
    created: 1384643111961,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: 'a2b15c14-4f2a-11e3-a20f-033b3759658f',
    created: 1384653028800,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: 'a4a582aa-5021-11e3-87b3-07bd4acceef0',
    created: 1384759117770,
    owner: 'd31fb37f-7428-11e2-a3b3-02e81adcf3d0' },
  { id: '2e5269fa-5022-11e3-a12d-1b79e03f0476',
    created: 1384759348751,
    owner: 'd31fb37f-7428-11e2-a3b3-02e81adcf3d0' },
  { id: '3334024a-50c6-11e3-9775-13d673f37520',
    created: 1384829794404,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '0bc945da-50cb-11e3-99e1-593145abb312',
    created: 1384831875757,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: 'f6985b7a-51b4-11e3-9a86-a9773ebf9df2',
    created: 1384932342439,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: 'be34576a-5241-11e3-a8bd-89589106743e',
    created: 1384992806870,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '6fe2ff4a-5493-11e3-9e2d-33ff7a381889',
    created: 1385247796532,
    owner: '5893116a-275a-11e3-be34-f9ef93e2dea2' },
  { id: 'b0dec93a-54d3-11e3-8d51-4f748c6a309b',
    created: 1385275393347,
    owner: '5893116a-275a-11e3-be34-f9ef93e2dea2' },
  { id: 'cb6fed5a-5533-11e3-8875-a9a65354bdf5',
    created: 1385316669605,
    owner: '187fd5ea-fd9d-11e2-ad49-a53cfe993bb8' },
  { id: 'd6e7285a-5543-11e3-8a5e-2745fb0c796d',
    created: 1385323560789,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: 'fec7228a-5543-11e3-b8db-aded809e463e',
    created: 1385323627688,
    owner: '0a0f9599-9921-11e2-b8af-02e81ae640dc' },
  { id: '4d064f0a-555f-11e3-af0d-1976715e46dd',
    created: 1385335355376,
    owner: '0ccaf7ea-2659-11e3-9cc9-37aa58c1f5ef' } ]    
