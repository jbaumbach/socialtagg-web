
app.controller("UserActivity", function ($scope, $route, UserActivity) {

  $scope.summary = UserActivity.get(
    function success(dataSummary) {
      // loading = false

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

      //console.log(dataSummary);

      _.each(dataSummary.data, function(value, key) {
        //console.log();
        if (value instanceof Object) {
          //console.log('pushing key: ' + key);
          data.labels.push(value.week);
          data.datasets[0].data.push(value.count);
        }
      });

      console.log(data);

      //
      // Extra computation to workaround floats on y-axis bug
      // https://github.com/nnnick/Chart.js/issues/58
      //
/*
      var maxValue = st_getMaxValueOfChartData(data);

      var options = {
        scaleOverride: true,
        scaleSteps: maxValue,
        scaleStepWidth: 1,
        scaleStartValue: 0
      }
*/
      var options = {};

      //Get the context of the canvas element we want to select
      var ctx = document.getElementById("usersChart").getContext("2d");
      var myNewChart = new Chart(ctx).Line(data, options);

    }, function fail() {
      console.log('crud, error: ' + arguments[0].data.msg);
    }
  )
});