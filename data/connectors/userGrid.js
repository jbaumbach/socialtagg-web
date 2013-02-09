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
//var defaultConnectionUrl = 'mongodb://localhost:27017/socialtagg?w=1';
//var dbConnectionUrl = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || defaultConnectionUrl;


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

//
// Close the connection
//
module.exports.close = function() {
  throw('Not implemented');
}