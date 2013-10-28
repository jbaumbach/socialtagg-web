/**
 * User: jbaumbach
 * Date: 9/14/13
 * Time: 10:32 AM
 */


angular.module("eventAnalyticsDataService", ["ngResource"]).
  factory("EventAnalyticsData", function($resource) {
    return $resource(
      "/apiv1/loggedinuser/ownedevents/:eventId/analyticsdata"
    );
  });

app.requires.push('eventAnalyticsDataService');

var analyticsController = app.controller('analyticsController', function ($scope, EventAnalyticsData, $log) {

  $scope.dataResults = [];
  $scope.isLoading = [];
  $scope.isLoadingMsg = [];
  $scope.displayType = [];
  
  // Thanks: http://stackoverflow.com/questions/236936/how-pick-colors-for-a-pie-chart
  var dataColors = [
    '#56e2cf',
    '#5668e2',
    '#8a56e2',
    '#e256ae',
    '#e28956',
    '#aee256',
    '#cf56e2',
    '#68e256',
    '#56e289',
    '#e25668',
    '#e2cf56',
    '#56aee2'
  ];

  //
  // Adds presentation style to the raw data
  //
  function applyStyleToChartData(data, type) {

    // todo: grab this from the style sheet
    var fillColor = '#14ABFA';    // SocialTagg blue
    var strokeColor = '#666666';  // body color (dark grey)

    data.datasets.forEach(function (ds) {
      ds.fillColor = fillColor;
      ds.strokeColor = strokeColor;
    });

  };

  var loadNonChartType = function(dataSetType) {
    
    $scope.isLoading[dataSetType] = true;
    $scope.isLoadingMsg[dataSetType] = 'Loading...';

    var options = { eventId: $scope.eventId, type: dataSetType };

    var data = EventAnalyticsData.get(options, function () {
      // Success
      // note: the display timing is a little funky here, maybe fix in future versions.
      $scope.isLoading[dataSetType] = false;
      $scope.dataResults[dataSetType] = data.datapoints;

      $scope.dataResults['averageContaggsPerAttendee'] = averageContaggs();
      
    }, function() {
      // Fail!

      $log.info('error!');
      $scope.isLoadingMsg[dataSetType] = 'Oops, error loading data.';
    });
  }
  
  var loadChartType = function (dataSetType, chartType) {

    $scope.isLoading[dataSetType] = true;
    $scope.isLoadingMsg[dataSetType] = 'Loading...';

    var ctxCTS = document.getElementById(dataSetType).getContext('2d');

    var options = { eventId: $scope.eventId, type: dataSetType };

    var data = EventAnalyticsData.get(options, function () {
      // Success

      function getMaxValueOfChartData(data) {
        var result = 0;
        
        if (data && data.datasets && data.datasets.length > 0) {
          angular.forEach(data.datasets[0].data, function(item) {
            if (item > result) {
              result = item;
            }
          })
        }
        
        return result;
      }
      
      $scope.isLoading[dataSetType] = false;

      if (chartType === 'bar') {
        //
        // The data is returned from the service unstyled because it's data.  Let's 
        // style it the way we want.
        //
        applyStyleToChartData(data, dataSetType);
  
        //
        // Extra computation to workaround floats on y-axis bug
        // https://github.com/nnnick/Chart.js/issues/58
        //
        var maxValue = getMaxValueOfChartData(data);
        
        var options = {
          scaleOverride: true,
          scaleSteps: maxValue,
          scaleStepWidth: 1,
          scaleStartValue: 0
        }
  
        var chrtCTS = new Chart(ctxCTS).Bar(data, options);
          
      } else if (chartType === 'sq') {
        //
        // Survey questions
        //
        $scope.displayType[dataSetType] = data.type;
        
        // The chart type is dependent on the question type
        if (data.type === 'multichoice' || data.type === 'scale_1to5') {
          
          //
          // Put in some colors.  These are used by the pie chart AND the legend.
          //
          data.datapoints.forEach(function(datapoint, index) {
            var colorIndex = index % dataColors.length;
            var color = dataColors[colorIndex];
            datapoint.color = color;
          });
          
          var chrtCTS = new Chart(ctxCTS).Pie(data.datapoints, {});
          $scope.dataResults[dataSetType] = data.datapoints;
          
        } else if (data.type === 'freeform') {
          
        } else {
          $log.info('(error) survey question ' + chartType + ' has an unknown type: ' + data.type);
          
        }
      } else {
        $log.info('(error) unknown chart type: ' + chartType);
      }
      
    }, function () {
      // Error
      $log.info('error! for ' + dataSetType);
      $scope.isLoadingMsg[dataSetType] = 'Oops, error loading chart.';

    });
  }
  
  var averageContaggs = function() {
    if ($scope.dataResults['totalCheckins'] != null && $scope.dataResults['contaggsExchanged'] != null) {
      if ($scope.dataResults['totalCheckins'] > 0) {
        return $scope.dataResults['contaggsExchanged'] / $scope.dataResults['totalCheckins'];
      } else {
        return 'n/a';
      }
    } else {
      return null;
    }
  }

  $scope.init = function (pageVars) {

    /* 
      General logic:
      
      loadChartType(d, t) - loads data onto a predefined canvas on the page
        d: dataset to load
          '[string]' - pre-defined dataset param to pass to the API
          'sq-[int]' - survey question id to pass to API
        t: type:
          'bar' - bar chart
          'pie' - pie chart

      loadNonChartType(d) - similar to loadChartType, but just putting the results in 
        Angular for display however the frontend wants.
     
      This section is getting close to refactor time.  It's beyond it's original design
      capacity.
     */
    $scope.eventId = pageVars.uuid;

    loadNonChartType('totalCheckins');
    loadNonChartType('contaggsExchanged');
    
    // todo: loadChartType('checkinTimeSummary', 'bar');
    loadChartType('companySummary', 'bar');
    loadChartType('titlesSummary', 'bar');
    
    if (pageVars.surveyQuestions) {
      //
      // I feel there's a more elegant way to do this.  But my brain hurts right now.
      //
      if (pageVars.surveyQuestions.chartable) {

        pageVars.surveyQuestions.chartable.forEach(function(question) {
          loadChartType('sq-' + question.questionId, 'sq');
        });
      }
      
      if (pageVars.surveyQuestions.nonChartable) {

        pageVars.surveyQuestions.nonChartable.forEach(function(question) {
          loadNonChartType('sq-' + question.questionId);
        });
      }
    }
  }
});


/*
// Directive to prevent the default html action for following # anchors
analyticsController.directive('noClick', function() {
  return function(scope, element, attrs) {
    $(element).click(function(event) {
      event.preventDefault();
    });
  }
});
*/