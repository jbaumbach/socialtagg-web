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

function getQueryStringParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function generateGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

// Test error handling if user requests it
if (getQueryStringParameterByName('testerror')) {
  var thisWillThrowUndefinedException = hello.there;
}
