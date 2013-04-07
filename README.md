## SocialTagg Node.js Website

  This is the source code of the SocialTagg website.  It includes these general features:

   * Built with Node.js and Express
   * REST API with authentication scheme
   * Fully commented for people coming from a Microsoft .NET/RDBMS background
   * Data layer demonstrating connecting to and storing data in UserGrid and/or MongoDb
   * Data layer decoupled from application layer for easily changing databases
   * Defined classes (well, Javascript's version of a class) for application object models
   * User account create/edit, demonstrating password hashing and salting
   * User login with sessions stored in Redis
   * Presentation layer using layouts (e.g. "master pages" in .NET Webforms) and includes (e.g. "user controls")
   * HTML generated using Jade rendering engine, also demonstrating conditionals
   * CSS generated using Stylus rendering engine (with Nib plugin for abstracting away CSS hacks, thank you http://clock.co.uk/tech-blogs/a-simple-website-in-nodejs-with-express-jade-and-stylus)
   * Unit and integration testing architecture with Mocha
   * HTML black box testing demonstration with Supertest
   * Load testing your application with Nodeload
   * Deploy your app to production at Heroku

## Quick Start

   * Install node.js on your system.
   * Download the source code.
   * Install dependencies
   
    $ npm install

   * Fire up the application server:

    $ node app

   If all goes well, the startup message will show the url to copy to your browser to see the app in action.

## Running Tests

 To run the test suite, execute this command.  Note that the integration tests depend on an existing test 
 user, so be sure to create that and update the source code values.  Otherwise, some of these will bomb out:

    $ mocha --recursive --reporter spec

 To run the load test (runs for 2 minutes):

    $ node loadtest.js

## Day to day SVN and Heroku operations

   The SocialTagg website uses Assembla+SVN for general source control operations, and Heroku uses GIT for
   deployment to the production website.
   
   This is a bit of a headache since you have not one but two source control systems using your code at the same
   time.  Here are the general things you need to do:
   
   * Get the source from Assembla+SVN.  We're using 1.7+.  This should create a local .svn directory.
   * By default, Mac comes with SVN 1.6.  You need to update your local SVN so that command line operations will work.  This is a pain in the @ss
    since brew doesn't update it properly.  I used brew first since it installs a bunch of dependencies (especially "neon"), then
    when it fails d/l the source directly from Apache and manually build it.  This is a good guide, if you use brew you can start
    with step #3: http://blog.countableset.ch/2013/01/10/compile-svn-for-osx/
   * When the step above is done, you'll probably have two SVN versions installed (1.6 and 1.7).  Follow the instructions
    here about getting the right one to run in your terminal: http://superuser.com/questions/455214/where-is-svn-on-os-x-mountain-lion
   * Be sure to ignore the .git and .idea directories in SVN.  Here's a guide to do that: http://stackoverflow.com/questions/116074/how-to-ignore-a-directory-with-svn
   * There's a .gitignore file in SVN.  It ignores all the SVN files by default, so you should be good there.
   * Tell Webstorm (the preferred Node.js editor) to use SVN for source control ("CMD-,", then "Project Properties", "Source Control").  
   * Deploy to production easily with the bash script:
   
    $ ./deploy-to-heroku.sh
    
    
    