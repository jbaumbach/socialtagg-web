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
});
    
    
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
  
  var r = eventapi.getQuestionTypeForId(survey, 1);
  assert.equal(r, 'multichoice', 'didn\'t get multichoice');
  
  r = eventapi.getQuestionTypeForId(survey, 3);
  assert.equal(r, 'freeform', 'didn\'t get freeform');
  
  r = eventapi.getQuestionTypeForId(survey, 334);
  assert.ok(!r, 'got something other than undefined back for bogus id');
  
  
})

it('should get answers for a survey and some toher stuff i can\'t think about', function() {
  var answers = { responses:
    [ { user: '3d86497b-66c4-11e2-8b37-02e81ac5a17b',
      created: 1381740849448,
      answers:
        [ { created: 1381761599889,
          uuid: '9c12bfba-d728-4e5c-a51f-b51f4ca7d354',
          modified: 1381834266482,
          answer: '4',
          question_id: '1' },
          { created: 1381761608667,
            uuid: '123c084d-273d-46dd-bdf1-d5d1bac98423',
            modified: 1381834266482,
            answer: 'TEST TEST AGAIN AND AGAIN',
            question_id: '2' },
          { created: 1381761613653,
            uuid: '574736c0-3045-4d87-b784-e1c259c8e7a8',
            modified: 1381834266482,
            answer: 'An abomination of all that is good in this world.',
            question_id: '3' },
          { created: 1381763200966,
            uuid: 'de9807f0-ffb0-4afc-b701-7ba97c70e6cc',
            modified: 1381834266482,
            answer: 'BLAH BLAH BLAH SIS BOOM BAH FA LA LA',
            question_id: '4' } ] } 
    ] }
  
  
})