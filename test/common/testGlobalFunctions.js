//
// Let's test some global functions action
//
var assert = require('assert');

var globalFunctions = require('../../common/globalfunctions');

describe('globalFunctions', function() {

  //
  // Mock the request and session.  This tests our functions, not the session object.
  //
  it('should have undefined userId if no session', function() {
    var req = {};
    req.session = {};
    var sessionInfo = globalFunctions.getSessionInfo(req);

    assert.equal(undefined, sessionInfo.userId, 'user id is not undefined');
  });

  it('should retain user id in session', function() {
    var req = {};
    req.session = {};
    req.session.sessionInfo = { userId: 'yoda' };
    var sessionInfo = globalFunctions.getSessionInfo(req);

    assert.equal('yoda', sessionInfo.userId, 'didn\'t get user id properly');
  });

  it('should set the session info', function() {
    var req = {};
    req.session = {};
    var sessionInfo = { userId: 'boba' };
    
    globalFunctions.setSessionInfo(req, sessionInfo);
    
    assert.equal('boba', req.session.sessionInfo.userId, 'Session userId not set correctly');
  });
  
  it('should login user', function() {
    var req = {};
    req.session = {};
    var userId = 'luke';
  
    globalFunctions.loginUser(req, userId);
    
    assert.equal('luke', req.session.sessionInfo.userId, 'Session userId not set correctly');
  });
  
  it('should log out the user', function() {
    var req = {};
    req.session = {};
    req.session.sessionInfo = { userId: 'agentsmith' };
    
    globalFunctions.logoutUser(req);
    
    assert.equal(req.session.sessionInfo, undefined, 'Did not null out session properly');
  });
  
  it('should have some kind of password hashing', function() {
    var password = 'uggabugga';
    var password2 = 'uggabugga';
    
    var hashedPw = globalFunctions.hashPassword(password);
    var hashedPw2 = globalFunctions.hashPassword(password2);
    
    assert.notEqual(hashedPw, password, 'Password not altered');
    assert.equal(hashedPw, hashedPw2, 'Hash not reproducible');
  });
  
  it('should generate unique id and pw vals from seed value', function() {
    
    var uniqueVal = 'uggabugga';
    var res = globalFunctions.generateUniqueCredentials(uniqueVal);
    var expectedPWLength = 32;
    
    assert.notEqual(uniqueVal, res.uid, 'UID not unique');
    assert.notEqual(uniqueVal, res.password, 'PW not unique');
    assert.notEqual(res.uid, res.password, 'UID is same as password!');
    
    assert.equal(expectedPWLength, res.uid.length, 'UID not ' + expectedPWLength + ' chars in length');
    assert.equal(expectedPWLength, res.password.length, 'PW not ' + expectedPWLength + ' chars in length');
    
  });
  
  //
  // Class Extensions
  // 
  it('should allow String class to truncate on a word boundary and other stuff', function() {
    var str = 'this is a long string with some words';
    
    var truncated1 = str.truncate(12);
    assert.equal(str.substr(0, 11), truncated1, 'didn\'t truncate string');
    
    var truncated2 = str.truncate(12, true);
    assert.equal(str.substr(0, 9), truncated2, 'didn\'t truncate at word');
    
    var truncated3 = str.truncate(12, true, '...');
    assert.equal(str.substr(0, 9) + '...', truncated3, 'didn\'t add extra stuff');
    
    var nonTruncated1 = str.truncate(500, true, '...');
    assert.equal(str, nonTruncated1, 'shouldn\'t have changed anything');
  });
  
  it('should remove scheme in urls', function() {
    var naked = 'www.socialtagg.com';
    var noScheme = '//' + naked;
    var regularUrl = 'http:' + noScheme;
    var secureUrl = 'https:' + noScheme;
    var weirdUrl = 'www.urlwithhttpinit.com/morehttps';
    var weirdUrlInt = '//' + weirdUrl;
    var weirdUrl2 = 'http:' + weirdUrlInt;
    
    assert.equal(naked, naked.removeScheme(), 'didn\'t leave naked url alone');
    assert.equal(noScheme, noScheme.removeScheme(), 'didn\'t leave schemeless urls alone');
    assert.equal(noScheme, regularUrl.removeScheme(), 'didn\'t remove scheme from regular url');
    assert.equal(noScheme, secureUrl.removeScheme(), 'didn\'t remove scheme from secure url');
    assert.equal(weirdUrl, weirdUrl.removeScheme(), 'replaced too many https');
    assert.equal(weirdUrlInt, weirdUrl2.removeScheme(), 'didn\'t understand extra http\'s');
      
  });
  
  it('should htmlize some values in a string', function() {
    var source = 'this\r\nis on multiple\r\n\nlines';
    var newSource = source.htmlize();
    
    assert.equal(newSource.match(/<br>/g).length, 3, 'didn\'t replace all \\n\'s with <br>s');
  });
  
  
  it('should find a value in an array of objects', function() {
    var vals = [
      { id: 5, name: 'steve' },
      { id: 10, name: 'jones' },
      { id: 11, name: 'jason'}
    ];
    
    assert.equal(vals.find('id', 10), vals[1], 'didn\'t find id of 10');
    assert.equal(vals.find('id', 99), undefined, 'found object that does not exist');
    assert.equal(vals.find('name', 'steve'), vals[0], 'steve is MIA');

  });
  
  it('should split a name into first name and last name', function() {
    var r1 = globalFunctions.splitNames('steve jones');
    assert.equal(r1.firstName, 'steve', 'didn\'t get "steve" back');
    assert.equal(r1.lastName, 'jones', 'didn\'t get "jones" back');
  });
  
  it('should convert date to default if null', function() {
    var date;
    var def = 'nada';
    
    var r = globalFunctions.convertDate(date, def);
    assert.equal(r, def, 'didn\'t get default back');
  });
  
  it('should return formatted date', function() {
    var date = new Date();
    var res = date.toDateString();
    var def = 'blah';
    
    var r = globalFunctions.convertDate(date, def);
    assert.equal(r, res, 'didn\'t get formatted date back');
  });
}) 