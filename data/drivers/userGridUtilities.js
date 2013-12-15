/**
 * User: jbaumbach
 * Date: 10/21/13
 * Time: 1:31 AM
 */

var util = require('util')
  , client = require('./../connectors/userGrid')
  , globalFunctions = require('../../common/globalfunctions')
  , async = require('async')
  ;

/*
 Helper function to loop through all rows in a collection and call an interator function.
  Parameters:

 options: object with properties:
   queryOptions: usergrid query options.  Row limit default is 100. 
   aggregator: iterator function that accepts these parameters:
     collectionRow: a row from the collection that we're counting.  You are responsible
                   for accessing the data values and incrementing your counters
     callback: (optional) if provided, the function to callback when aggregator is done.  The callback
               is called in parallel for each item in the collectionRows.
 callback: a function with this signature:
   err: filled in if something went wrong
 */
var counterFunction = exports.counterFunction = function(options, callback) {

  options.queryOptions.qs.limit = options.queryOptions.qs.limit || 100;

  client().createCollection(options.queryOptions, function(err, resultCollection) {
    if (err) {
      callback(err, null);
    } else {

      var mainHasAnotherPage;

      function countItemsOnPage(cb) {

        async.waterfall([
          function(acb) {

            //
            // Two options here - no callback for each iterator, and with callback for each iterator
            //
            if (options.aggregator.length == 1) {
              //
              // If it's a simple aggregator function, don't bother with callbacks.
              //
              while (resultCollection.hasNextEntity()) {

                var collectionRow = resultCollection.getNextEntity(); // Note: ignoring errors here
                options.aggregator(collectionRow);
              }
              acb();

            } else if (options.aggregator.length == 2) {

              //
              // We DO need to wait for all iterator calls to complete, but we can do the
              // calls in parallel.
              //

              var rows = [];
              while (resultCollection.hasNextEntity()) {
                rows.push(resultCollection.getNextEntity()); // Note: ignoring errors here
              }

              async.each(rows, options.aggregator, function(err) {
                acb(err);
              });

            } else {
              throw ('unsupported number of arguments passed to options.aggregator function');
            }
          }
        ], function(err) {

          mainHasAnotherPage = resultCollection.hasNextPage();

          if (mainHasAnotherPage) {
            resultCollection.getNextPage(function(err) {
              cb(err);
            });
          } else {
            cb();
          }
        })

      }

      async.doWhilst(countItemsOnPage, function() { return mainHasAnotherPage; }, function(err) {
        callback(err);
      });
    }
  })
}
