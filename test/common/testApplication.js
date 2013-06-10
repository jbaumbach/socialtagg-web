/**
 * User: jbaumbach
 * Date: 2/12/13
 * Time: 12:13 AM
 */


var assert = require('assert')
  , application = require('../../common/application')
  , userManager = require('../../data/userManager')
  , globalFunctions = require('../../common/globalfunctions') // Case sensitive require!!!
  , User = require('../../models/User')
  , util = require('util')
;

//
// Temp variable to hold the existing function pointer in userManager.
//
var tempUserManagerGetUser
  , tempGlobalFunctionsGetSessionInfo
  ;


describe('application class', function() {

  before(function() {
    //
    // Record existing function pointer.
    //
    tempUserManagerGetUser = userManager.getUser;
    tempGlobalFunctionsGetSessionInfo = globalFunctions.getSessionInfo;
  });

  after(function() {
    //
    // Reset the user manager, or other tests in this run could fail.
    //
    userManager.getUser = tempUserManagerGetUser;
    globalFunctions.getSessionInfo = tempGlobalFunctionsGetSessionInfo;
  });

  it('should get a user from the session ok', function(done) {
    var sampleUserId = 'blah';
    var sampleName = 'Lando';
    
    //
    // Let's mock some functions out.
    //
    globalFunctions.getSessionInfo = function() {
      return { userId: sampleUserId };
    };

    userManager.getUser = function(userId, callback) {
      callback(new User( { id: userId, name: sampleName } ));  
    };
    
    application.getCurrentSessionUser({}, function(retreivedUser) {
      assert.equal(sampleUserId, retreivedUser.id, 'Didn\'t get right id back');
      assert.equal(sampleName, retreivedUser.name, 'Did not get right name back');
      
      done();
    });
  });

  it('should return empty object from session if no user logged in', function(done) {

    globalFunctions.getSessionInfo = function() {
      return { userId: undefined };
    };

    application.getCurrentSessionUser({}, function(retreivedUser) {
      assert.equal(undefined, retreivedUser.userId, 'Did not get empty object back');

      done();
    });
  });
  
  it('should return a sanitized user from bad values', function() {
    
    var unsafeVals = {
      userName: '<script>Lavamantis</script>',
      name: '<br>JohnnyB',
      address: '12345 Yo Mama</ br>',
      email: 'hello@there.<html>com',
      phone: 'abcdef12345jklmn<header>',
      pictureUrl: 'http://www.socialtagg.com/mypicture.png',
      website: 'http://www.socialtagg.com/myurl',
      bio: 'I love CSS attacks! <script>alert(\'hello!\');</script>',
      company: 'my<td>company</td>',
      title: 'my<head>title</head>',
      twitter: '@hacker<br>'
    };
    
    var unsafeUser = new User(unsafeVals);
    
    var safeUser = application.getSanitizedUser(unsafeUser);
    
    // Do some assertings...
    
    assert.equal('&lt;script&gt;Lavamantis&lt;/script&gt;', safeUser.userName, 'username not sanitized');
    assert.equal('&lt;br&gt;JohnnyB', safeUser.name, 'user name not sanitized');
    assert.equal('12345 Yo Mama&lt;/ br&gt;', safeUser.address, 'user address not sanitized');
    assert.equal('hello@there.&lt;html&gt;com', safeUser.email, 'user email not sanitized');
    assert.equal('abcdef12345jklmn&lt;header&gt;', safeUser.phone, 'user phone not samitized');
    assert.equal(unsafeVals.pictureUrl.removeScheme(), safeUser.pictureUrl, 'pictureUrl not copied');
    assert.equal(unsafeVals.website, safeUser.website, 'website not copied');
    assert.equal('I love CSS attacks! &lt;script&gt;alert(&#39;hello!&#39;);&lt;/script&gt;', safeUser.bio, 'user bio not sanitized');
    assert.equal('my&lt;td&gt;company&lt;/td&gt;', safeUser.company, 'user company not sanitized');
    assert.equal('my&lt;head&gt;title&lt;/head&gt;', safeUser.title, 'user title not sanitized');
    assert.equal('@hacker&lt;br&gt;', safeUser.twitter, 'user twitter not sanitized');
    
  });

  it('should return a complete sanitized user from good values', function() {

    var safeVals = {
      id: 'blah',
      userName: 'Lavamantis',
      name: 'JohnnyB',
      firstName: 'time',
      lastName: 'warner',
      address: '12345 Yo Mama',
      email: 'hello@there.com',
      phone: 'abcdef12345jklmn',
      pictureUrl: '//www.socialtagg.com/mypicture.png',
      website: 'http://www.socialtagg.com/myurl',
      bio: 'I love CSS attacks!',
      company: 'my company',
      title: 'my title',
      twitter: '@hacker'
    };

    var safeUser = new User(safeVals);

    var newSafeUser = application.getSanitizedUser(safeUser);

    // Do some assertings...

    //
    // Get us an array of keys containing the names of all the original properties
    //
    var propertiesTested = 0;
    var originalProps = Object.keys(safeVals);

    originalProps.forEach(function(propName) {

      var propValue = safeVals[propName];
      var actualValue = eval("newSafeUser." + propName);

      assert.equal(actualValue, propValue, 'didn\'t get back our property for ' + propName);
      propertiesTested++;
    });

    assert.equal(Object.keys(safeVals).length, propertiesTested, 'did\'t test all the properties');
  });
  
  it('should generate a random verification code of 6 numbers', function() {
    
    var res = application.getForgotPasswordEmailVerificationCode();
    var length = 6;
    
    assert.equal(res.length, length, 'wasn\'t '+ length + 'digits');
    assert.equal(/[0-9]{6}/.test(res), true, 'wasn\'t all numbers');
    
  });
  
  it('should add facebook parameter to request a large image when processing facebook image url', function() {
    var url = 'http://graph.facebook.com/783990326/picture';
    var updatedUrl = application.processImageUrlForLargerSize(url);

    var hasParam = updatedUrl.match('/facebook.com.*\?.*type=large/i');
    assert.equal(hasParam, null, 'didn\'t add parameters');
  });

  
  it('should add facebook parameter with correct delimiter to request a large image when processing facebook image url', function() {
    var url = 'http://graph.facebook.com/783990326/picture?john=cool';
    var updatedUrl = application.processImageUrlForLargerSize(url);

    var hasParam = updatedUrl.match('/facebook.com.*\?.*&type=large/i');
    // console.log('got hasParam: ' + hasParam + ', also got back: ' + updatedUrl);
    assert.equal(hasParam, null, 'didn\'t add right delimiter');
  });

  
  it('should not add facebook parameter to request a large image when processing non-facebook image url', function() {
    var url = 'http://graph.google.com/783990326/picture';
    var updatedUrl = application.processImageUrlForLargerSize(url);

    assert.equal(updatedUrl, url, 'shouldn\'t have added parameter');
  });

  it('should not crap out on null when procssing an image url', function() {
    var url;
    var updatedUrl = application.processImageUrlForLargerSize(url);

    var isOk = (updatedUrl === undefined || updatedUrl === null);
    assert.ok(isOk, 'didn\'t get back what we put in');
  });

  it('for csv should not allow invalid format', function(done) {
    application.buildUserExportFile(null, 'dumbformat', function(err, data) {
      assert.equal(err, 1, 'didn\'t bomb as expected');
      done();
    })
  });

  it('for csv should return good data', function(done) {
    var users = [];
    users.push(new User({
      title: 'Bounty,Hunter',
      userName: 'bobafett',
      firstName: 'Boba',
      lastName: '"Hanfinder" Fett'
    }));
    
    // This user should NOT have the first field ('title'), we want to test the
    // bug fix for the missing column if the first field is empty.
    users.push(new User({
      firstName: 'Ron',
      lastName: 'Burgandy',
      email: 'ron@channel4news.com',
      website: 'www.anchorman.com',
      phone: '555-1212'
    }));
    
    application.buildUserExportFile(users, 'csv', function(err, data) {
      assert.ok(data.match(/^Title/), 'didn\'t find title header value as first thing');
      assert.ok(data.match(/"Bounty,Hunter"/), 'didn\'t get escaped title value');
      assert.ok(data.match(/""Hanfinder"" Fett/), 'didn\'t handle double quotes right');
      
      assert.ok(data.match(/ron@channel4news.com/), 'didn\'t find Ron\'s email');
      assert.ok(data.match(/www.anchorman.com/), 'did not find website');
      assert.ok(data.match(/555-1212/), 'did not find phone number');
      
      //
      // Let's count some columns
      //
      var lines = data.split('\n');
      var headerColCount = lines[0].split(',').length;
      assert.ok(headerColCount > 0, 'need at least one column');
      
      // Poor-man's parse of the CSV.  This will break if there's a comma in a field
      var burgandyColCount = lines[2].split(',').length;
      
      assert.equal(burgandyColCount, headerColCount, 'burgandy didn\'t have all cols');
      
      done();
    })
  });

  it('should return user id of logged in user', function(done) {
    
    var uid = 'abdce';
    var fakeSessionInfo = { userId: uid };
    
    // Mock the loginStatus function
    var tempLoginStatus = application.loginStatus;
    var tempGetSessionInfo = globalFunctions.getSessionInfo;
    
    application.loginStatus = function () { return 2; };
    globalFunctions.getSessionInfo = function() { return fakeSessionInfo; };
    
    assert.equal(application.getCurrentSessionUserId(), uid, 'did\'t get right user id');
    
    // Unmock the mocked loginStatus function
    application.loginStatus = tempLoginStatus;
    globalFunctions.getSessionInfo = tempGetSessionInfo;
    
    done();
  });

  it('should return no user id if no one logged in', function(done) {

    var fakeSessionInfo;

    // Mock the loginStatus function
    var tempGetSessionInfo = globalFunctions.getSessionInfo;

    globalFunctions.getSessionInfo = function() { return fakeSessionInfo; };

    assert.ok(!application.getCurrentSessionUserId(), 'did\'t get untruthy user id');

    // Unmock the mocked loginStatus function
    globalFunctions.getSessionInfo = tempGetSessionInfo;

    done();
  })
});
  