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
  return new usergrid.client({
    orgName: 'tagg',
    appName: 'tagg',
    
    /*
     } else if (this.authType === AUTH_APP_USER) {
     qs['access_token'] = self.getToken();
     */
    authType:usergrid.AUTH_CLIENT_ID,
    
    // Find below credentials here: https://apigee.com/usergrid/#tagg/tagg/organization
    
    clientId: 'b3U6dEm4a9j5EeGvrRIxOwHVwQ',  //'YXA6lOxfCdkIEeGvrRIxOwHVwQ',
    clientSecret:'b3U6z-d4_iF8UbxNt9aqNqtzHDSBV9s',  //'YXA62r4rQiF8JcZZmLSW9z10GC6dbxY',

    logging: true  //optional - turn on logging, off by default
  });
};
