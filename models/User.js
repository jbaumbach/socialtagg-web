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
  this.name = values.name || '';
  this.address = values.address || '';
  this.email = values.email || '';
  this.phone = values.phone || '',
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

module.exports = User;