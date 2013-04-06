## Node.js Scaffolding

  Hello, and welcome!  This repository is a full-stack node.js sample application that demonstrates an 
  architecture for building a complete production
  website with node.js.  It features an architectural demonstration of these features:

   * Built with Node.js and Express
   * REST API with authentication scheme
   * Fully commented for people coming from a Microsoft .NET/RDBMS background
   * Data layer demonstrating connecting to and storing data in MongoDb
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

