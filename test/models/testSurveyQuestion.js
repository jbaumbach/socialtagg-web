/**
 * User: jbaumbach
 * Date: 9/22/13
 * Time: 1:03 PM
 */

var assert = require('assert')
  , SurveyQuestion = require('../../models/SurveyQuestion')
;


describe('SurveyQuestion model', function() {

  it('should understand all possible survey question types and whether they are chartable', function() {
    //
    // Basically, we just want to make sure this loop runs ok w/o throwing any 'not supported' errors
    //
    SurveyQuestion.questionTypes.forEach(function(type, index) {
      //
      // Make a fake question of each possible type
      //
      var q = { id: index, type: type.value };
      var r = SurveyQuestion.isSurveyQuestionChartable(q);
    })
  })

  it('should get proper chartable and unchartable questions', function() {
    var qs = [
      { id: 1, type: 'scale_1to5' },  // true
      { id: 2, type: 'multichoice' }, // true
      { id: 3, type: 'freeform' }     // false
    ];

    var r1 = SurveyQuestion.surveyQuestionsChartable(qs, true);
    assert.equal(r1.length, 2, 'didn\'t get the right number of chartable (got: ' + r1.length + ')');

    var r2 = SurveyQuestion.surveyQuestionsChartable(qs, false);
    assert.equal(r2.length, 1, 'didn\'t get the right number of non-chartable');
  });

  it('should add a description to a question based on type', function() {
    var q = { id: 1, type: 'multichoice' };

    SurveyQuestion.addDescriptionToQuestion(q);
    
    assert.equal(q.description, 'Multiple choice', 'didn\'t get right description back');
  })
  
  it('should add a description to a list of questions', function() {
    var qs = [
      { id: 1, type: 'scale_1to5' },
      { id: 2, type: 'multichoice' },
      { id: 3, type: 'freeform' }
    ];

    var lengthBefore = qs.length;
    
    SurveyQuestion.addDescriptionToQuestions(qs);
    
    assert.equal(qs.length, lengthBefore, 'didn\'t preserve length');
    
    qs.forEach(function(question) {
      assert.ok(question.description, 'didn\'t add description for question: ' + question.type);
    })
  });
  
  it('shouldn\'t crash on bad list of questions to add descriptions to', function() {
    var block = function() { SurveyQuestion.addDescriptionToQuestions(); }
    assert.doesNotThrow(block, 'crashed on undefined');
  })
});