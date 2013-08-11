/**
 * User: jbaumbach
 * Date: 8/10/13
 * Time: 11:06 AM
 */

var thisModule = this
  , localCache = require('memory-cache')    // this is an in-app version, prolly ok for time being but not scalable
;

// todo: implement memcache, there's a free version on Heroku and the d/l for dev seems quick and easy
//  http://memcached.org/
//  https://devcenter.heroku.com/articles/memcachier#node-js


exports.addToCache = function(object, callback) {
  
  if (object) {
    
    var key = object.cacheKey;
    
    if (key) {

      // Note: ttl is in minutes, cache thingy likes milliseconds
      var ttl = object.cacheTtl * 1000 * 60;
      
      // Add to cache
      localCache.put(key, object, ttl);    
      
      console.log('(info) addToCache: added ' + key + ' to cache with ttl: ' + ttl);
      
    } else {
      
      console.log('(warning) addToCache: could not find cache key for item');
  
    }
  } else {
    
    console.log('(info) addToCache: no object to cache - not adding');
    
  }
  
  callback();
  
};

exports.getFromCache = function(key, callback) {
  
  // Get from cache

  console.log('(info) getFromCache for key: ' + key);


  var object = localCache.get(key);
  
  console.log('(info) getFromCache: found object? ' + object);
  
  callback(object);
  
}
