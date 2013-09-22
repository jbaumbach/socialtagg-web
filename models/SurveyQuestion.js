/**
 * User: jbaumbach
 * Date: 9/22/13
 * Time: 12:30 PM
 */

var thisModule = this
  , _ = require('underscore')
;

/*
  This is not a proper class yet.  It's just a holding place for some business logic.
  Eventually this can be built out.
 */

/* 
  All possible question types.  These must match the Angular page values.
 */
var questionTypes = [
  { label: 'Scale of 1 to 5', value: 'scale_1to5' },
  { label: 'Multiple choice', value: 'multichoice' },
  { label: 'Freeform Input', value: 'freeform' }
];

//
// Let's make these available externally.
//
exports.questionTypes = questionTypes;


exports.isSurveyQuestionChartable = function(question) {
  //
  // Obviously, the survey question should be converted to a class and this set
  // as a property on it.  But, these don't change much, this is prolly ok for now.
  //

  switch (question.type) {
    case 'scale_1to5': return true;
    case 'multichoice': return true;
    case 'freeform': return false;
    default:
      //
      // This should only happen during development
      //
      var msg = '(error) unsupported question type: ' + question.type;
      console.log(msg);
      throw msg;
  }
}

/*
 Filters the passed list of questions by whether they are chartable or not.
 Chartable questions are handled in a generic way on the analytics page, where
 the non-chartable have to be freeform.
 */
exports.surveyQuestionsChartable = function(questions, areChartable) {
  return _.reject(questions, function(question) {
    return !(thisModule.isSurveyQuestionChartable(question) === areChartable);
  });
}

/*
  Takes the question object and adds a field 'description' to it based on it's type
 */
exports.addDescriptionToQuestion = function(question) {
  question.description = _.findWhere(questionTypes, { value: question.type }).label;
}

/*
 Takes the list of questions and adds a field 'description' to them based on it's type
 */
exports.addDescriptionToQuestions = function(questions) {
  if (questions && questions.length > 0) {
    questions.forEach(function(question) {
      thisModule.addDescriptionToQuestion(question);
    })
  }
}
