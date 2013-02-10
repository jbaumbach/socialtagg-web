/*

 Low level support of the UserGrid connection.

 Check out instructions here: https://github.com/apigee/usergrid-node-module
 
 */

var util = require('util')
  , usergrid = require('usergrid')
  ;

//
// UserGrid connection parameters
// todo: read from environment variables
//

//
// Main export: the global database connection.  If we're not connected, throw 
// an error.
//
module.exports = function() {
  var client = new usergrid.client({
    orgName:'tagg',
    appName:'tagg',
    authType:usergrid.AUTH_CLIENT_ID,
    clientId:'YXA6lOxfCdkIEeGvrRIxOwHVwQ',
    clientSecret:'YXA62r4rQiF8JcZZmLSW9z10GC6dbxY',

    logging: true  //optional - turn on logging, off by default
  });

  return client;
}
