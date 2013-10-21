/**
 * User: jbaumbach
 * Date: 7/23/13
 * Time: 11:34 PM
 */

var eventManager = require('../../data/eventManager')
  , assert = require('assert')
  , util = require('util')
  , cache = require('../../common/cache')
;


describe('eventManager', function() {
  
  this.timeout(9000);
  
  it.skip('should create an event', function(done) {
  
    // put creation code here
    done();
  });
  
  it('should grab a survey for an event', function(done) {
    
    var eventId = 'd295e83a-0f8a-11e3-a682-2346c22487a2'; // has survey
    var cacheKey = 'eventManager.getSurvyeByEventId.' + eventId;
    var status = {
      checkedKey: false,
      checkedResult: false
    }

    var origadder = cache.addToCache;

    function exitWhenDone() {
      if (status.checkedKey && status.checkedResult) {
        cache.addToCache = origadder;
        done();
      }
    }
    
    
    cache.addToCache = function mockAdder(options, cb) {
      
      assert.equal(options.key, cacheKey);
      status.checkedKey = true;
      cb();
    }
    
    eventManager.getSurveyByEventId(eventId, function(err, survey) {
      assert.ok(!err, 'got an error');
      assert.equal(survey.eventId, eventId, 'didn\'t get back right event id');
      
      status.checkedResult = true;
      exitWhenDone();
    })
  })

  it('should not bomb grabbing a survey for an event with no survey', function(done) {

    var eventId = '5c935f4a-2ff2-11e3-8997-05c3745a7888'; // has no survey
    eventManager.getSurveyByEventId(eventId, function(err, survey) {

      done();
      
    })
  })


  it('should grab user counts for an event', function(done) {

    var eventId = '2ad0769a-2abc-11e3-8462-4b5f96a08764'; // Lewis' event, should have checkins
    var cacheKey = 'eventManager.getEventUsersCounts.' + eventId;
    var status = {
      checkedKey: false,
      checkedResult: false
    }

    var origadder = cache.addToCache;

    function exitWhenDone() {
      if (status.checkedKey && status.checkedResult) {
        cache.addToCache = origadder;
        done();
      }
    }

    cache.addToCache = function mockAdder(options, cb) {
      assert.equal(options.key, cacheKey);
      status.checkedKey = true;
      cb();
    }

    eventManager.getEventUsersCounts(eventId, function(err, result) {
      assert.ok(!err, 'got an error');

      assert.equal(result.registered, 4, 'didn\'t get the registrations right');
      assert.equal(result.checkins, 3, 'didn\'t get the checkins right')


      status.checkedResult = true;
      exitWhenDone();
    })
  })

  it('should not bomb if there are no checkins', function(done) {

    var eventId = '5c935f4a-2ff2-11e3-8997-05c3745a7888'; // no checkins

    eventManager.getEventUsersCounts(eventId, function(err, result) {
      assert.ok(!err, 'got an error');

      assert.equal(result.registered, 0, 'didn\'t get the registrations right');
      assert.equal(result.checkins, 0, 'didn\'t get the checkins right')

      done();
    })
  })

})