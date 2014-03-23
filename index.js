/**
 * Module dependencies.
 */

var redis = require('redis')
  , noop = function () {};

/**
 * Export `RedisStore`.
 */

module.exports = RedisStore;

/**
 * RedisStore constructor.
 *
 * @param {Object} options
 * @param {Bucket} bucket
 * @api public
 */

function RedisStore(options, bucket) {
  options = options || {};
  this.bucket = bucket || {};
  this.client = options.client || new redis.createClient(options.port, options.host, options);
  if (options.password) {
    this.client.auth(options.password, function auth(err){
      if (err) throw err;
    });
  }
}

/**
 * Get an entry.
 *
 * @param {String} key
 * @param {Function} fn
 * @api public
 */

RedisStore.prototype.get = function get(key, fn) {
  fn = fn || noop;
  this.client.get(key, function getter(err, data){
    if (err) return fn(err);
    if (!data) return fn(null, null);
    data = data.toString();
    try {
      fn(null, JSON.parse(data));
    } catch (e) {
      fn(e);
    }
  });
};

/**
 * Set an entry.
 *
 * @param {String} key
 * @param {Mixed} val
 * @param {Number} ttl
 * @param {Function} fn
 * @api public
 */

RedisStore.prototype.set = function set(key, val, ttl, fn) {

  if ('function' === typeof ttl) {
    fn = ttl;
    ttl = null;
  }

  fn = fn || noop;

  try {
    val = JSON.stringify(val)
  } catch (e) {
    return fn(e);
  }

  if (-1 === ttl) {
    this.client.set(key, val, cb);
  } else {
    this.client.setex(key, (ttl || 60), val, cb);
  }

  function cb(err) {
    if (err) return fn(err);
    fn(null, val);
  }
  
};

/**
 * Delete an entry.
 *
 * @param {String} key
 * @param {Function} fn
 * @api public
 */

RedisStore.prototype.del = function del(key, fn) {
  fn = fn || noop;
  this.client.del(key, fn);
};

/**
 * Clear all entries for this bucket.
 *
 * @param {String} key
 * @param {Function} fn
 * @api public
 */

RedisStore.prototype.clear = function clear(key, fn) {

  var store = this;

  if ('function' === typeof key) {
    fn = key;
    key = '';
  }

  fn = fn || noop;
  
  store.client.keys(key + '*', function keys(err, data) {
    if (err) return fn(err);
    var count = data.length;
    data.forEach(function each(key) {
      store.del(key, function del(err, data) {
        if (err) {
          count = 0;
          return fn(err);
        }
        if (--count == 0) {
          fn(null, null);
        }
      });
    });
  });
};