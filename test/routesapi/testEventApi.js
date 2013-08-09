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
  ;

describe('Event API', function() {

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
 
  
});
    
    
