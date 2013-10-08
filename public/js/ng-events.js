/**
 * User: jbaumbach
 * Date: 7/7/13
 * Time: 6:53 PM
 */

angular.module("eventService", ["ngResource"]).
  factory("Event", function ($resource) {
    return $resource(
      "/apiv1/loggedinuser/ownedevents/:uuid",
      { uuid: "@uuid" },
      { "update": { method: "PUT" } }
    );
  });


angular.module('surveyService', ['ngResource']).
  factory("Survey", function($resource) {
    return $resource(
      "/apiv1/loggedinuser/ownedevents/:eventId/surveys/:uuid",
      { eventId: "@eventId", uuid: "@uuid" },
      { "update": { method: "PUT"} }
    );
  });


// Add services dependencies to the app 
app.requires.push('eventService');
app.requires.push('surveyService');

// We're using this too
// app.requires.push('ui.bootstrap');

//  $dialog,
var eventController = app.controller('eventController', function($scope, Event, Survey, $dialog) {

  $scope.isCurrentEventSaved = false;
  $scope.isLoading = true;
  $scope.hasError = false;
  
  var standardDateFormat = 'MM/DD/YYYY';
  var standardTimeFormat = 'h:mm a';
  var startDatePicker;
  var endDatePicker;

  function pickerOptions(element, event, property) {
    return {
      field: document.getElementById(element),
      firstDay: 0,
      minDate: new Date('2000-01-01'),
      maxDate: new Date('2020-12-31'),
      defaultDate: event[property] ? new Date(event[property]) : new Date(),
      yearRange: [2000,2020],
      setDefaultDate: true,
      format: standardDateFormat,
      onSelect: function() {
        $scope.$apply(function() {
          //
          // Make Angular aware of the new data
          //
          event[property] = document.getElementById(element).value;
          $scope.calculateTzOffset(event);
        });
      }
    }
  }
  
  var createEvent = function (newEvent) {

    $scope.isWorking = true;
    
    newEvent.$save(function() {

      $scope.isWorking = false;

      $scope.events.push(newEvent);
      $scope.hasEvents = true;
      
      setEdit(false, null);
      
    }, function() {
      $scope.isWorking = false;

      setErr(true, arguments);
    });
  };

  var updateEvent = function(event) {

    $scope.isWorking = true;

    event.$update(function() {

      $scope.isWorking = false;
      $scope.isCurrentEventSaved = true;

      setEdit(false, null);

    }, function() {
      $scope.isWorking = false;

      // Note: "arguments" are returned from the server
      setErr(true, arguments);
    });
  };

  var setEdit = function(isEditVisible, editableEvent) {
    
    $scope.isEditVisible = isEditVisible;
    $scope.editableEvent = editableEvent;
    setErr(false, null);
    
    // Load up survey questions and other event initialization
    if (isEditVisible) {
      $scope.isCurrentEventSaved = editableEvent.uuid ? true : false;
      initSurvey(editableEvent);

      if (startDatePicker) {
        startDatePicker.destroy();
      }
      
      if (endDatePicker) {
        endDatePicker.destroy();
      }
      
      startDatePicker = new Pikaday(pickerOptions('inputStartDate', editableEvent, 'startDate'));
      endDatePicker = new Pikaday(pickerOptions('inputEndDate', editableEvent, 'endDate'));
    }
  }
  
  var setErr = function(hasError, arguments) {
    $scope.hasError = hasError;
    
    if (hasError) {
      if (arguments.length > 0 && arguments[0].data && arguments[0].data.errors) {
        $scope.errorMsg = arguments[0].data.errors.join(', ');
      } else {
        $scope.errorMsg = 'Unknown server error, please try again in a bit.';
      }
    }
  }

  /*
    Display an OK/Cancel box, and call the specified function if the user clicks OK.
   */
  var continueIfUserConfirms = function(title, msg, continueFunction) {

    var btns = [{result:'cancel', label: 'Cancel'}, {result:'ok', label: 'OK', cssClass: 'btn-primary'}];

    //
    // Note: $dialog goes away in angular-ui 0.6.0 and higher.
    //
    $dialog.messageBox(title, msg, btns)
      .open()
      .then(function(result){
        
        var shouldContinue = (result === 'ok');
        
        if (shouldContinue) {
          continueFunction();
        }
      });
  }

  $scope.showEdit = function () {
    setEdit(true, new Event());
  };

  $scope.cancelEdit = function() {
    setEdit(false, null);
  }
  
  $scope.saveEvent = function (event) {
    // If existing event, updated it else create it.
    if (event.uuid) {
      updateEvent(event);
    }
    else {
      createEvent(event);
    }
  };

  $scope.editEvent = function (event) {
    setEdit(true, event);
  };

  $scope.deleteEvent = function (event) {
    
    var deleteEventFunction = function() {
      
      event.isWorking = true;
      event.$delete(function() {
        
        $scope.events = _.without($scope.events, event);
        $scope.hasEvents = $scope.events.length > 0;
        
        setEdit(false, null);
  
      }, function() {
        
        event.isWorking = false;
      });
    }
    
    var title = 'Confirm Delete';
    var msg = 'Are you sure you wish to delete event "' + event.name + '"?';
    
    continueIfUserConfirms(title, msg, deleteEventFunction);
  };

  $scope.calculateTzOffset = function(event) {
    var str = event.startDate + ' ' + event.startTime;
    var fmt = standardDateFormat + ' ' +  standardTimeFormat;
    var dm = moment(str, fmt);
    
    event.timezoneOffset = dm.zone() / -60; 
  };
  
  $scope.isEditVisible = false;
  $scope.events = Event.query(function() {
    // query complete
    $scope.isLoading = false;
    $scope.hasEvents = $scope.events && $scope.events.length > 0;
    
  });

  //********
  // Survey Questions 
  //********
  
  function initSurvey(event) {

    function createSurvey() {

      $scope.survey = new Survey();
      $scope.survey.eventId = event.uuid;
      $scope.survey.inactiveInd = true;
      $scope.survey.questions = [];

    };
    
    $scope.isLoadingSurvey = true;
    
    if (event.uuid) {
      $scope.survey = Survey.get({ eventId: event.uuid }, function() {
        // Done loading events
        $scope.isLoadingSurvey = false;
        
        if (!$scope.survey) {
          createSurvey();
        }
      }, function() {
        // Error?
        $scope.isLoadingSurvey = false;

        createSurvey();
      });
    } else {
      $scope.survey = null;
    }
  }

  $scope.showSurvey = function() {
    $scope.survey.inactiveInd = false;
  }

  $scope.surveyTypes = [
    { label: 'When attendee checks in', value: 'showOnCheckin' },
    { label: 'A specific number of minutes after event ends', value: 'showAfterXMins' },
    { label: 'The next morning', value: 'showNextMorn' }
  ];

  $scope.questionTypes = [
    { label: 'Scale of 1 to 5', value: 'scale_1to5' },
    { label: 'Multiple choice', value: 'multichoice' },
    { label: 'Freeform Input', value: 'freeform' }
  ];
  
  $scope.showMultichoice = function() {
    var isMultiChoiceQuestion = $scope.editableQuestion && 
      $scope.editableQuestion.type === 'multichoice';

    if (isMultiChoiceQuestion) {
      $scope.editableQuestion.choices = $scope.editableQuestion.choices || [];
    } else if ($scope.editableQuestion) {
      $scope.editableQuestion.choices = undefined;
    } 
    
    return isMultiChoiceQuestion;
  }
  
  $scope.addSurveyQuestion = function() {
    $scope.editableQuestion = {};
  }
  
  $scope.removeQuestion = function(question) {
    $scope.survey.questions = _.without($scope.survey.questions, question);
    $scope.editableQuestion = null;
  }
  
  $scope.editQuestion = function(question) {
    $scope.editableQuestion = question;
  }

  $scope.saveQuestion = function(question) {
    
    if (!question.questionId) {
      
      var newQuestionId = 0;
      // Get the next question id.  Holes in the order are ok.
      $scope.survey.questions.forEach(function(question) {
        newQuestionId = Math.max(newQuestionId, question.questionId);
      });
      newQuestionId++;
      question.questionId = newQuestionId;
      $scope.survey.questions.push(question);
    }
    
    $scope.editableQuestion = null;
  }
  
  function saveSurvey(theSurvey) {

    console.log('saving survey...');
    
    $scope.isSurveyWorking = true;
    
    if (theSurvey.uuid) {
      
      // Update the survey
      theSurvey.$update(function() {
        
        // Updated ok
        $scope.isSurveyWorking = false;
        setErr(false, null);


      }, function() {
        
        // Error updating
        $scope.isSurveyWorking = false;

        // Note: "arguments" are returned from the server
        setErr(true, arguments);
      });
      
    } else {
      
      // Insert the survey
      theSurvey.$save(function() {
        
        // Saved ok
        $scope.isSurveyWorking = false;
        setErr(false, null);


      }, function() {
        
        // Crud, an error
        $scope.isSurveyWorking = false;

        // Note: "arguments" are returned from the server
        setErr(true, arguments);
      });
    }
    
  };
  
  $scope.saveSurvey = function() {
    saveSurvey($scope.survey);
  }
  
  $scope.removeSurvey = function() {
    
    function removeIt() {
      console.log('(info) removing survey...');
      $scope.survey.inactiveInd = true;
      saveSurvey($scope.survey);
    }

    var title = 'Confirm Remove Survey';
    var msg = 'Are you sure you wish to remove the survey for this event?';
    
    continueIfUserConfirms(title, msg, removeIt);

  }
  
  
  //********
  // Multiple choice - possible answers 
  //********

  $scope.saveMultichoicePossibleAnswer = function() {
    $scope.editableQuestion.choices.push($scope.multichoicePossibleAnswer);
    $scope.multichoicePossibleAnswer = null;
  }

  $scope.removeMultichoicePossibleAnswer = function(choice) {
    $scope.editableQuestion.choices = _.without($scope.editableQuestion.choices, choice);
  }
});

// Directive to prevent the default html action for following # anchors
eventController.directive('noClick', function() {
  return function(scope, element, attrs) {
    $(element).click(function(event) {
      event.preventDefault();
    });
  }
});
