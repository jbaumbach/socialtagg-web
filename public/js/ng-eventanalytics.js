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

var analyticsController = app.controller('analyticsController', function ($scope, EventAnalyticsData) {

  $scope.dataResults = [];
  $scope.isLoading = [];
  $scope.isLoadingMsg = [];
  $scope.displayType = [];

  /* First try
  var dataColors = [
    '#434343',    
    '#0713B7',    
    '#9501AF',    
    '#CCCCCC', //brown   
    '#434343',
    '#0713B7',
    '#5B2B63',
    '#C7CCCC', //brown
    '#434343',
    '#2F3367',
    '#5B2B63',
    '#363636',  //brown
    '#424242',
    '#000648',
    '#3A0044',
    '#363636'   // brown   
  ];
  */
  
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

  var loadChartType = function (dataSetType, chartType) {

    console.log('loading ' + dataSetType + '...');

    $scope.isLoading[dataSetType] = true;
    $scope.isLoadingMsg[dataSetType] = 'Loading...';

    var ctxCTS = document.getElementById(dataSetType).getContext('2d');

    var options = { eventId: $scope.eventId, type: dataSetType };

    var data = EventAnalyticsData.get(options, function () {
      // Success

      console.log('success');

      $scope.isLoading[dataSetType] = false;

      if (chartType === 'bar') {
        //
        // The data is returned from the service unstyled because it's data.  Let's 
        // style it the way we want.
        //
        applyStyleToChartData(data, dataSetType);
  
        var options = {
          // Put some space between the bars
          barValueSpacing: 20
        }
  
        var chrtCTS = new Chart(ctxCTS).Bar(data, options);
          
      } else if (chartType === 'sq') {
        
        console.log('setting displaytype for ' + dataSetType + ' to ' + data.type);
        
        $scope.displayType[dataSetType] = data.type;
        
        // The chart type is dependent on the question type
        if (data.type === 'multichoice' || data.type === 'scale_1to5') {
          
          //
          // Put in some colors.  These are used by the pie chart AND the legend.
          //
          data.datapoints.forEach(function(datapoint, index) {
            var colorIndex = index % dataColors.length;
            var color = dataColors[colorIndex];
            console.log('colorIndex: ' + colorIndex + ', color: ' + color);
            datapoint.color = color;
          });
          
          var chrtCTS = new Chart(ctxCTS).Pie(data.datapoints, {});
          $scope.dataResults[dataSetType] = data.datapoints;
          
        } else if (data.type === 'freeform') {
          
          console.log('gonna do freeform');
        } else {
          console.log('(error) survey question ' + chartType + ' has an unknown type: ' + data.type);
          
        }
      } else {
        
        console.log('(error) unknown chart type: ' + chartType);
      }
      
    }, function () {
      // Error

      console.log('error!');
      $scope.isLoadingMsg[dataSetType] = 'Oops, error loading chart.';

    });
  }

  $scope.init = function (pageVars) {

    $scope.eventId = pageVars.uuid;

    loadChartType('checkinTimeSummary', 'bar');
    loadChartType('companySummary', 'bar');
    loadChartType('titlesSummary', 'bar');
    
    if (pageVars.surveyQuestions) {
      pageVars.surveyQuestions.forEach(function(question) {
        loadChartType('sq-' + question.questionId, 'sq');
      })
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