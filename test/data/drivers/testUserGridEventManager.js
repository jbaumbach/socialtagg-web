/**
 * User: jbaumbach
 * Date: 8/8/13
 * Time: 11:40 PM
 */

var assert = require('assert')
  , globalFunctions = require('../../../common/globalfunctions') // Case sensitive require!!!
  , userGridEventManager = require('../../../data/drivers/userGridEventManager')
  , util = require('util')
  ;

describe('userGridEventManager', function() {
  
  var origGFuncMd5;
  
  function mockGFuncsMd5(newFunction) {
    origGFuncMd5 = globalFunctions.md5Encode;
    globalFunctions.md5Encode = newFunction;
  }
  
  function unMockGFuncsMd5() {
    globalFunctions.md5Encode = origGFuncMd5;
  }

  this.timeout(5000);

  it('should get a survey from raw data ok', function() {
  
    var s = {
      "eventId": "42e60bfa-fd80-11e2-b3fe-3df7a1a1c275",
      "isAnonymous": true,
      "whenToShowType": "showAfterXMins",
      "whentoShowMins": 20,
      "inactiveInd": false,
      "questions": [
        {
          "text": "Hello There",
          "questionId": 1,
          "type": "scale_1to5"
        }
      ]
    };
    
    mockGFuncsMd5(function() {
      return 'uggabugga';
    });
    
    var r = userGridEventManager.userGridSurveyFromData(s);

    unMockGFuncsMd5();

    assert.equal(r.type, 'surveys', 'didn\'t set survey type');
    assert.equal(r.event_uuid, s.eventId, 'didn\'t translate event id');
    assert.equal(r.name, 'survuggabugga', 'didn\'t set survey name');

    assert.equal(r.questions.length, 1, 'didn\'t set the questions');
    assert.equal(r.inactive_ind, false, 'didn\'t save inactive ind');
    
    assert.equal(r.when_to_show_mins, s.whentoShowMins, 'didn\'t set when to show mins');
    assert.equal(r.when_to_show_type, s.whenToShowType, 'didn\'t set when to show type');
    
  });
  
  // Note: if anyone else checks in or registers for this event, this will break.  Prolly
  // should set up a test-only event.
  it('should get total checkins and registrations ok', function(done) {
    
    var eventId = 'b9a9138a-4296-11e3-af47-51a116293e74';  // JBs unit test event - don't change 
    
    userGridEventManager.getEventUsersCounts(eventId, function(err, result) {
      
      //console.log('got: ' + util.inspect(result));
      
      assert.equal(result.registered, 4, 'didn\'t get the registrations right');
      assert.equal(result.checkins, 1, 'didn\'t get the checkins right')
      
      done();
    })
  })
  
  it('should get total contaggs for an event', function(done) {
    var eventId = "d295e83a-0f8a-11e3-a682-2346c22487a2";   // John's test event
    
    userGridEventManager.getEventTotalContaggs(eventId, function(err, result) {
      assert.equal(result.contaggs, 1, 'didn\'t get all the contaggs');
      done();
    });
  });
  
  it('should get companies represented from db', function(done) {
    var eventId = "d295e83a-0f8a-11e3-a682-2346c22487a2";   // John's test event
    
    userGridEventManager.getEventCompaniesRepresented(eventId, function(err, result) {
      assert.ok(result, 'got null result!');
      done();
    });
  });
  
});