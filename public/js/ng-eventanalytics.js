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

  var loadChartType = function (type) {

    console.log('loading ' + type + '...');

    $scope.isLoading[type] = true;
    $scope.isLoadingMsg[type] = 'Loading...';

    var ctxCTS = document.getElementById(type).getContext('2d');

    var options = { eventId: $scope.eventId, type: type };

    var data = EventAnalyticsData.get(options, function () {
      // Success

      console.log('success');

      $scope.isLoading[type] = false;

      //
      // The data is returned from the service unstyled because it's data.  Let's 
      // style it the way we want.
      //
      applyStyleToChartData(data, type);

      var options = {
        // Put some space between the bars
        barValueSpacing: 20
      }

      var chrtCTS = new Chart(ctxCTS);

      // May need to 'eval()' this, tbd
      chrtCTS.Bar(data, options);

    }, function () {
      // Error

      console.log('error!');
      $scope.isLoadingMsg[type] = 'Oops, error loading chart.';

    });
  }

  $scope.init = function (pageVars) {

    $scope.eventId = pageVars.uuid;

    loadChartType('checkinTimeSummary');
    loadChartType('companySummary');
    loadChartType('titlesSummary');
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