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

/*
  Cache an object with properties .key and .ttl.
  
  Parameters:
    object: the object
    callback: a function with sig:
      err: filled in if error
      object: the original object
 */
exports.addObjectToCache = function(object, callback) {
  
  var options = {
    object: object
  }
  
  thisModule.addToCache(options, callback);
  
/*
  if (object) {
    
    var key = object.cacheKey;
    
    if (key) {

      // Note: ttl is in minutes, cache thingy likes milliseconds
      var ttl = object.cacheTtl * 1000 * 60;
      
      // Add to cache
      localCache.put(key, object, ttl);    
      
      console.log('(info) addObjectToCache: added ' + key + ' to cache with ttl: ' + ttl);
      
    } else {
      
      console.log('(warning) addObjectToCache: could not find cache key for item');
  
    }
  } else {
    
    console.log('(info) addObjectToCache: no object to cache - not adding');
    
  }
  
  callback();
*/
  
};

/*
  Add somethine to the cache.  
  
  Parameters:
    options: object with the properties:
      object: the object to store in the cache.  Null objects will not be stored.
      key:    the cache key to use.  If null, then check for the property object.cacheKey
      ttl:    how long to store in the cache, in minutes.  If null, check object.ttl.  Default is
              60 minutes.
    callback: function with sig:
      err: filled in if something went wrong
      object: the original object to store
 */
exports.addToCache = function(options, callback) {
  
  var object = options.object || {};
  
  var key = options.key || object.cacheKey;
  var ttl = (options.ttl || object.ttl || 60) * 1000 * 60;
  
  if (!key) {
    callback('(error) no cache key specified');
  } else {
    if (options.object) {
      // Store it
      localCache.put(key, options.object, ttl);
      console.log('(info) addToCache: added ' + key + ' to cache with ttl: ' + ttl);

    } else {
      console.log('(info) addOToCache: no object to cache - not adding');
    }
    callback(null, options.object);
  }
}

exports.getFromCache = function(key, callback) {
  
  // Get from cache

  console.log('(info) getFromCache for key: ' + key);


  var object = localCache.get(key);
  
  console.log('(info) getFromCache: found object? ' + object);
  
  callback(object);
  
}
