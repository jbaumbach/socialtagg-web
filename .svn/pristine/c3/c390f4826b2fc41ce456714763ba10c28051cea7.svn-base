
/*
 * GET home page.
 */

var globalFunctions = require('./../common/globalfunctions')
  , userManager = require('./../data/userManager')
  , application = require('../common/application')
  , userRoutes = require('./user')
  ;

exports.index = function(req, res){
  
  var loginStatus = application.loginStatus(req);
  
  if (loginStatus === 2) {
    //
    // Let's display the logged in user's profile as the homepage.
    // 
    
    //
    // Technical debt: the .detail function needs a param in the url.  Prolly
    // should refactor that call to remove the dependency.
    //
    req.params.id = globalFunctions.getSessionInfo(req).userId;
    
    userRoutes.detail(req, res);
    
  } else {
    
    var pageVars =
    {
      title: 'Home',
      currentSessionUser: {},
      links: application.links()
    };

    res.render('index', pageVars);
  }
};
