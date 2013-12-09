
app.controller("EventActivity", function ($scope, $route, EventActivity) {
  
  $scope.detailUrl = function(item) {
    return "/admin/#/event-activity/" + item.year + "/week/" + item.week;
  }
  
  $scope.summary = EventActivity.get(
    function success(dataSummary) {

      var data = {
        labels: [],
        datasets: [
          {
            fillColor : "rgba(220,220,220,0.5)",
            strokeColor : "rgba(220,220,220,1)",
            pointColor : "rgba(220,220,220,1)",
            pointStrokeColor : "#fff",
            data : []
          }
        ]
      };

      _.each(dataSummary.data, function(value, key) {
        if (value instanceof Object) {
          data.labels.push(value.week);
          data.datasets[0].data.push(value.count);
        }
      });

      //
      // Extra computation to workaround floats on y-axis bug
      // https://github.com/nnnick/Chart.js/issues/58
      //
      var maxValue = st_getMaxValueOfChartData(data);

      var options = {
        scaleOverride: true,
        scaleSteps: maxValue,
        scaleStepWidth: 1,
        scaleStartValue: 0
      }

      //Get the context of the canvas element we want to select
      var ctx = document.getElementById("eventsChart").getContext("2d");
      var myNewChart = new Chart(ctx).Line(data, options);
      
    }, function fail() {
      console.log('crud, error: ' + arguments[0].data.msg);
    }
  )  
});