/*

  Define the properties of a User.  This "class" is not technically required (nor
  do "classes" actually exist in Javascript), because as a dynamic language
  you're allowed to create objects and add properties and methods on the fly.
  
  However, as your applications move beyond "trivial" and get a bit more
  complicated, it's useful to have a more solid definition of your models.
  This helps other developers get up to speed with your code quicker, and
  some IDEs (such as "Webstorm") can provide you with intellisense
  as you're coding.
  
  There are many many ways to implement "Class" patterns in Javascript.  Check
  out some of these discussions for more info:

    http://www.phpied.com/3-ways-to-define-a-javascript-class/
    http://stackoverflow.com/questions/387707/whats-the-best-way-to-define-a-class-in-javascript
    http://blog.mixu.net/2011/02/02/essential-node-js-patterns-and-snippets/
    http://css.dzone.com/articles/naked-javascript-defining
 
 */

var util = require('util')
  , globalFunctions = require('../common/globalfunctions')
  ;

//
// Return a new user
//
var User = function(values) {
  //
  // Explicitly initialize instance variables in the constructor.  All properties
  // not initialized here are treated as static variables.
  //
  values = values || {};

  this.id = values.id || '';
  this.userName = values.userName || '';
  this.firstName = values.firstName || '';
  this.lastName = values.lastName || '';
  this._name = undefined;
  this.name = values.name || '';    // Call property setter after name components are declared 
  this.address = values.address || '';
  this.email = values.email || '';
  this.phone = values.phone || '';
  this.password = values.password || '';
  this.pictureUrl = values.pictureUrl || '';
  this.pictureDataBytes = values.pictureDataBytes || '';
  this.pictureMimeType = values.pictureMimeType || '';
  this._createDate = values.createDate || new Date();  // Milliseconds since 1970 UTC
  this.createDateStr = values.createDateStr || new Date(this._createDate).toDateString();
  this.website = values.website || '';
  this.bio = values.bio || '';
  this.company = values.company || '';
  this.title = values.title || '';
  this.twitter = values.twitter || '';
  this.avatarId = values.avatarId;
}

//
// Properties w/getters and setters.
//

//
// Define a setter for createDate so that we can automatically update
// createDateStr as well.
//
Object.defineProperty(User.prototype, "createDate", {
  set: function(newDate) {
    this._createDate = newDate;
    this.createDateStr = new Date(newDate).toDateString();
  },
  get: function() {
    return this._createDate;
  }
});

//
// The path is derived; build it on-demand.
//
Object.defineProperty(User.prototype, "path", {
  get: function() {
    var result = '#'; 
    if (this.id) {
      
      // todo: update this when we have a urlmanager
      
      result = '/users/' + this.id;
    }  
    return result;
  }  
});

//
// The QR code is derived; build it on-demand.
//
Object.defineProperty(User.prototype, "qrCodeUrl", {
  get: function() {
    var urlEncodedPath = encodeURIComponent(this.path);
    var result = util.format('http://chart.apis.google.com/chart?cht=qr&chs=300x300&chl=%s', urlEncodedPath);
    return result;
  }  
});

//
// The full name built from the individual name components
//
Object.defineProperty(User.prototype, "name", {
  get: function() {
    var result = this._name || util.format('%s %s', this.firstName, this.lastName);
    return result;
  },
  set: function(fullName) {
    //
    // Attempt to split the name into sub components.  This is not recommended, but useful for testing.
    //
    var names = globalFunctions.splitNames(fullName);
    if (names) {
      this.firstName = names.firstName;
      this.lastName = names.lastName;
    } 
    this._name = fullName;
  }
});

//
// Export our class
//
module.exports = User;