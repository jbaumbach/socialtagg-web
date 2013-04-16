/**
 * User: jbaumbach
 * Date: 4/15/13
 * Time: 9:55 PM
 * 
 * Serves a config file for the mobile devices.  A few approaches:
 * 
 * 1. static file.  pros: quick to serve, easy to implement; cons: static file, no programmatic 
 *    control, requires deployment to prod server for each change
 * 
 * 2. serve from application. pros: dynamically create; cons: requires deployment to prod
 *    server.
 * 
 * 3. serve from application & usergrid.  pros: dynamically create, can use usergrid as 
 *    CMS system, no deployments; cons: harder to develop, slow w/o caching
 * 
 * Decision: can do #1 now, change to #3 if necessary.
 * 
 */

  
var util = require('util')
  , thisModule = this
;

//
// Sample config file.  For option #2.
//
var config = {
  ios: {
    ios_app_config: {
      "welcome_msg": "Hello from SocialTagg!"
    }
  }
}

exports.respond = function(res, responseCode, response) {
  res.format({
    json: function() {
      //
      //   The objects dumped include internal variables too, might want to sanitize them.
      //
      res.json(responseCode, response);
    }
  });
}

// todo: put in function to return name from a name.ext filename

//
// This function isn't done yet.  It could return a config section from the config.
//
exports.main = function(req, res) {

  var deviceType = req.params.deviceType;
  var file = req.params.file;
  var fileNoExt = file.match(/(.*)\.(.*)/);
  
  console.log(util.format('device: %s, file: %s', deviceType, file));

  //
  // Support for option #2.
  //
  var deviceConfig = eval('config.' + deviceType);
  
  if (deviceConfig) {
    var fileToServe = eval('config.' + deviceType + '.' + file);
    
    console.log(fileToServe);
    
  }
  
  thisModule.respond(res, 200, { device: deviceType, file: file });

};
