/**
 * User: jbaumbach
 * Date: 3/15/13
 * Time: 12:47 AM
 */

// Add support for console.log() just in case
if(typeof window.console == 'undefined') { window.console = {log: function (msg) {} }; }

// Extension to round decimal numbers
Number.prototype.round = function(places) {
  return +(Math.round(this + "e+" + places)  + "e-" + places);
}
