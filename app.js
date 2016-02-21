/*

 The one and only app.js file.

 As your app grows, parts of this would probably be split out into separate files for
 easier long-term maintenance.

 */

//
// These components are added by default by express.
//
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , index = require('./routes/index')
  , contactus = require('./routes/contactus')
  , features = require('./routes/features')
  , about = require('./routes/about')
  , mobile = require('./routes/mobile')
  , userApi = require('./routesapi/userapi')
  , eventApi = require('./routesapi/eventapi')
  , documentation = require('./routesapi/documentation')
  , tos = require('./routes/tos')
  , http = require('http')
  , path = require('path')
  , auth = require('./common/authorization')
  , application = require('./common/application')
  , event = require('./routes/event')
  , admin = require('./routes/admin/admin')
  , passport = require('passport')
  , LinkedInStrategy = require('passport-linkedin').Strategy
  , util = require('util')
  , globalFunctions = require(process.cwd() + '/common/globalfunctions')
  ;

//
// These are additional components to make node.js easier, faster, and more fun.
//
var stylus = require('stylus')
  , nib = require('nib')  // Added
//
// Note: The Heroku plugin will connect to either local Redis in the
// dev environment, or the Heroku redis if running on Heroku
//
  , HerokuRedisStore = require('connect-heroku-redis')(express)
  ;

var app = express();

//
// Configure any global app variables.  "globalVariables" is an export
// from the "application" module.
//
globalVariables = {
};

globalVariables.serverPhysicalPath = __dirname;

//
// Added compile function for Nib (vendor-prefix library)
//
function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib());
}

//
// CORS middleware.  Came from a combination of these answers:
//
// http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs (evilcelery)
// http://stackoverflow.com/questions/12409600/error-request-header-field-content-type-is-not-allowed-by-access-control-allow
//
var allowCrossDomain = function(req, res, next) {
  // This must be a * since we're changing the protocol on the login screen.
  // Adding the protocol to the domain value and passing that may work, haven't tried it.
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
}

//
// App configuration added by express.  You may want to move this out to a separate
// config class at some point.
//
app.configure(function(){

  //
  // Allow gzip compression of HTML, javascript, CSS, and JSON static files.
  // This line should come before the other middleware.
  //
  app.use(express.compress());


  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('cookiesecret'));

  //
  // Additional config for redis support in sessions.
  // addon: "Redis Togo - starter"
  //
  // Update 2013/06/10 JB: Redis working locally but not on Heroku.  Since
  // we have just the once instance, let's use local sessions for now so
  // Karim can demo the Contaggs export feature.
  // todo: get Redis working for sessions on Heroku
  //
  app.use(express.session({ store:new HerokuRedisStore({ttl: 20 * 60}), secret: 'sessionsecret'}));
  //console.log('(info) using built-in (non-production worthy) sessions');
  //app.use(express.session({ secret: 's0c1alsessionsecr&t'}));

  app.use(allowCrossDomain);

  //
  // 2014-03-15 JB: OAuth authentication via passport support
  //
  app.use(passport.initialize());

  app.use(app.router);

  /* Commenting out: not used in this version of the site
   //
   // Updated to add "compile" callback, required for Nib
   //
   app.use(stylus.middleware({
   src: __dirname + '/public'
   , compile: compile
   }));
   */

  //
  // Set up the static directory.  Let's have the downstream clients cache content for
  // an hour.  This can be extended when we figure out versioning of static content, like:
  //
  //    http://content.socialtagg.com/v1.2.3/css/mystyles.css
  //
  var oneHourInMillisecs = 60 * 60 * 1000;
  app.use(express.static(path.join(__dirname, 'public'), { maxAge: oneHourInMillisecs} ));

});


//
// Convenience variable for various things
//
var homePage = '/';

globalVariables.applicationHomepage = homePage;
globalVariables.productionServerPath = 'www.socialtagg.com';
globalVariables.productionSecureProtocol = 'https';
globalVariables.sentryDsn = process.env.SENTRY_DSN;

globalVariables.linkedInConsumerKey = 'yourkey';
globalVariables.linkedInConsumerSecret = 'yoursecret';

//
// todo: implement config files: http://stackoverflow.com/questions/5869216/how-to-store-node-js-deployment-settings-configuration-files
//

app.configure('development', function(){
  app.use(express.errorHandler());
  app.locals.pretty = true; // Output HTML w/line breaks and indents

  //
  // Different types of urls you can use during development
  //
  var localUrlOptions = {

    // Use this when testing from another device on your network, like an iPhone.  On Mac, use
    // "$ ifconfig" to see your IP.
    ip: '192.168.1.103',

    // Use this when testing locally.  If 'development.socialtagg.com', be sure to add the path
    // to your /etc/hosts file.  This is required for 'LastPass' testing, since it doesn't work for localhost.
    domain: 'development.socialtagg.com',

    // Default, use this if you don't require any of the above functionality.
    lh: 'localhost'
  }


  globalVariables.serverPath = localUrlOptions.domain + ':' + app.get('port');
  globalVariables.secureProtocol = 'http';
  globalVariables.sentryDsn = process.env.SENTRY_DSN || 'https://yourkey:yoursecret@app.getsentry.com/17028'; // dev/staging

  // Dark features.  Note - you need to implement these in application.buildApplicationPagevars()
  globalVariables.showpricing = true;    // Shows pricing menu item
  globalVariables.enablelinkedin = true;    // Enable linkedin login

});

app.configure('staging', function() {

  // old server: globalVariables.serverPath = 'evening-ocean-8134.herokuapp.com';
  globalVariables.serverPath = 'staging.socialtagg.com';
  globalVariables.secureProtocol = 'https';

  // Dark features
  globalVariables.showpricing = true;
  globalVariables.enablelinkedin = true;    // Enable linkedin login
});

app.configure('production', function() {

  globalVariables.serverPath = globalVariables.productionServerPath;
  globalVariables.secureProtocol = globalVariables.productionSecureProtocol;

  // todo: remove this dark feature switch and turn on linkedin full time
  globalVariables.enablelinkedin = true;    // Enable linkedin login

});


// *** Passport - authentication strategies we're supporting
// todo: move all passport logic out of app.js and into a more appropriate location

//
// Linkedin
//
// main: http://passportjs.org/guide/authenticate/
// linkedin: https://github.com/jaredhanson/passport-linkedin

passport.use(new LinkedInStrategy({
    consumerKey: globalVariables.linkedInConsumerKey,
    consumerSecret: globalVariables.linkedInConsumerSecret,
    callbackURL: "http://" + globalVariables.serverPath + "/loginpp/linkedin/callback",
    // Determine the fields to request from LI for the user - used in conjunction with the authentication "scope"
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'picture-url',
      'public-profile-url', 'headline']
  },
  function(token, tokenSecret, profile, done) {

    application.findOrCreateFromProvider(profile, function(err, user) {

      if (err) {
        if (err.err) {
          done(err.err);
        } else {
          done(null, false, { message: err.msg });
        }
      } else {
        done(null, user);
      }
    });

  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

//***************************************************************************
// Routing table for your app.  In a production
// environment, you'd want to enforce SSL for any sensitive info.
//***************************************************************************


//****  Public pages
app.get(homePage, routes.index);    // homepage
app.get('/contactus', contactus.contact);
app.post('/contactus', contactus.contacted);
app.get('/features', features.main);
app.get('/about', about.main);
app.get('/termsofservice', tos.main);
app.get('/pricing', features.pricing);

//**** Special one-time pages *****
app.get('/specialevents/teamextracurricularactivity', routes.specialEventsTeamExtCurrAct);
app.get('/imex', routes.specialEventsImex); // Jade has been made aware of root pages being undesirable but we're committed


//**** User and resource specific pages
app.get('/login', user.loginForm);
app.post('/login', user.login);
app.post('/loginfb', user.loginfb);

//**** Passport login stuff
app.get('/loginpp/linkedin',
  // todo: see if we can disable sessions and take out the serializeUser functions above
  passport.authenticate('linkedin', { scope: ['r_basicprofile', 'r_emailaddress', 'r_fullprofile'] }));

app.get('/loginpp/linkedin/callback', function(req, res, next) {
  passport.authenticate('linkedin', function(err, validatedUser, info) {
    if (err) {
      var errorMsg = err ? err.toString() : 'unknown error';
      globalFunctions.setSessionValue(req, 'passportError', errorMsg);
      res.redirect('/login');

    } else if (!validatedUser) {
      var errorMsg = info ? info.message : 'unknown error';
      globalFunctions.setSessionValue(req, 'passportError', errorMsg);
      res.redirect('/login');

    } else {
      // Log user in
      globalFunctions.loginUser(req, validatedUser.id);
      // Find way to go to loginDest
      res.redirect('/');
    }
  })(req, res, next);
});

app.post('/registration/createnewaccount', user.createRegistration);
app.get('/registration/verify', user.registrationVerify)
app.get('/logout', user.logout);
app.get('/users/:id', user.detail);
app.get('/events/:id', event.detail);
app.get('/users/:id/forgotpassword', user.forgotPassword);

//****  These pages require a logged in user
app.get('/mycontaggs', auth.requireLogin, user.myContaggs);
app.get('/myattendedevents', auth.requireLogin, user.myAttendedEvents);
app.get('/myownedevents', auth.requireLogin, user.myOwnedEvents);
app.get('/editprofile', auth.requireLogin, user.myProfile);
app.get('/viewprofile', auth.requireLogin, user.viewProfile);
app.get('/events/:id/analytics', auth.requireLogin, event.analytics);
app.get('/events/:id/checkinpage', auth.requireLogin, event.checkInPage); // Printer friendly page

//***** Admin site
app.get('/admin', auth.requireLogin, auth.authorize('systemreports'), admin.index);

//
// todo: extended user pages
//
//app.get('/users/new', user.new);
//app.post('/users/', user.upsert);

//
// API - documentation and REST endpoints
//
app.get('/api/documentation', auth.requireLogin, documentation.index);

//
// Routing table for the REST API
//
app.get('/apiv1/users/:id', auth.authenticate, userApi.detail);
// no immediate need to implement yet: app.get('/apiv1/users', auth.authorizeOld, userApi.list);
app.post('/apiv1/users', auth.authenticateTempOk, userApi.usersPost);  // Also used by apps to email users
app.put('/apiv1/users/:id', auth.authenticate, userApi.usersPut);

app.get('/apiv1/users/:id/contaggs', auth.authenticate, userApi.contaggs);   // Gets a CSV
app.post('/apiv1/users/:id/profilepicture', auth.authenticate, userApi.uploadProfilePicture);
app.put('/apiv1/users/:id/newpassword', userApi.setNewPassword);

//
// These are only called by the website/Angular for now.  Todo: figure out best authentication strategy.
//
app.get('/apiv1/loggedinuser/ownedevents', auth.sessionIdAuthenticate, eventApi.eventsOwnedByUserId);
app.post('/apiv1/loggedinuser/ownedevents', auth.sessionIdAuthenticate, eventApi.insertOwnedEvent);
app.put('/apiv1/loggedinuser/ownedevents/:id', auth.sessionIdAuthenticate, eventApi.updateOwnedEvent);
app.delete('/apiv1/loggedinuser/ownedevents/:id', auth.sessionIdAuthenticate, eventApi.deleteOwnedEvent);

app.get('/apiv1/loggedinuser/ownedevents/:eventId/surveys', auth.sessionIdAuthenticate, eventApi.getEventSurvey);
app.post('/apiv1/loggedinuser/ownedevents/:eventId/surveys', auth.sessionIdAuthenticate, eventApi.insertEventSurvey);
app.put('/apiv1/loggedinuser/ownedevents/:eventId/surveys/:surveyId', auth.sessionIdAuthenticate, eventApi.updateEventSurvey);
// Note: surveys are never deleted, they are just inactivated.

app.get('/apiv1/loggedinuser/ownedevents/:eventId/analyticsdata', auth.sessionIdAuthenticate, eventApi.eventAnalyticsData);

//
// These are public APIs, which may be called by website or other users.  May have authentication someday?
//
app.get('/apiv1/events/:id/users', eventApi.usersList);
app.post('/apiv1/resetpassword', userApi.resetPasswordWebsite);

app.get('/apiv1/socialtagg/events/activity', auth.authenticate, auth.authorize('systemreports'), eventApi.eventActivity);
app.get('/apiv1/socialtagg/events/activity/:year/:type/:id', auth.authenticate, auth.authorize('systemreports'), eventApi.eventActivityDetail);
app.get('/apiv1/socialtagg/users/activity', auth.authenticate, auth.authorize('systemreports'), userApi.userActivity);


//
// Add functions available to Jade
//
app.locals({
  globalFunctions: require('./common/globalfunctions')
});

var startupMessage = '\r\n' +
  '   ********************************************************\r\n' +
  '   *\r\n' +
  '   *  Express server listening on port ' + app.get('port') + '\r\n' +
  '   *  Environment: ' + app.get('env') + '\r\n' +
  '   *\r\n' +
  '   *  Dependent on services:\r\n' +
  '   *\r\n' +
  '   *    Redis:    $ ./redis-server --loglevel verbose\r\n' +
  '   * \r\n' +
  '   *  Check out your home page in a browser by going to:\r\n' +
  '   * \r\n' +
  '   *    ' + globalVariables.serverPath + '\r\n' +
  '   * \r\n' +
  '   *  Sentry DSN: ' + (globalVariables.sentryDsn || 'warning!! none!!!') + '\r\n' +
  '   ********************************************************\r\n';

// todo: implement SSL in dev environment:
// http://stackoverflow.com/questions/5998694/how-to-create-an-https-server-in-express-js-node-js


// todo: environment variables and Heroku setup
// Set up ssl port, use for login screen on various envs
// See:
//  http://expressjs.com/api.html
//  https://devcenter.heroku.com/articles/config-vars
//  http://stackoverflow.com/questions/10714315/node-js-express-and-using-development-versus-production-in-app-configure
//  http://stackoverflow.com/questions/15058954/node-js-is-there-any-documentation-about-the-process-env-variable
// Currently: Heroku staging and prod (I think) are set up as 'development',
// although I'm not sure how node is setting that by default.



//
// Start the webserver and process requests.
//
http.createServer(app).listen(app.get('port'), function(){
  console.log(startupMessage);
});

//
// Export the app object for integration testing (see ./test/views/testUser.js)
//
exports.app = function() {
  return app;
};