'use strict';

/**
 * Module dependencies.
 */

import redis from 'redis';
import parser from 'parse-redis-url';

/**
 * Module constants.
 */

const parse = parser(redis).parse;
const noop = () => {};

export default class RedisStore {

  /**
   * RedisStore constructor.
   *
   * @param {String|Object} options
   * @api public
   */

  constructor(options = {}) {

    if ('string' === typeof options) {
      options = parse(options);
    }

    if ('function' === typeof options.setex) {
      this.client = options;
    } else if (options.client) {
      this.client = options.client;
    }  else if (!options.port && !options.host) {
      this.client = new redis.createClient();
    } else {
      this.client = new redis.createClient(options.port, options.host, options);
    }

    if (options.password) {
      this.client.auth(options.password, (err) => {
        if (err) throw err;
      });
    }

    if (options.database) {
      this.client.select(options.database, (err) => {
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

  get(key, fn = noop) {

    this.client.get(key, (err, data) => {
      if (err) return fn(err);
      if (!data) return fn(null, null);
      data = data.toString();
      try {
        fn(null, JSON.parse(data));
      } catch (e) {
        fn(e);
      }
    });
  }

  /**
   * Set an entry.
   *
   * @param {String} key
   * @param {Mixed} val
   * @param {Number} ttl
   * @param {Function} fn
   * @api public
   */

  set(key, val, ttl, fn = noop) {

    if ('function' === typeof ttl) {
      fn = ttl;
      ttl = null;
    }

    try {
      val = JSON.stringify(val)
    } catch (e) {
      return fn(e);
    }

    const cb = (err) => {
      if (err) return fn(err);
      fn(null, val);
    }

    if (-1 === ttl) {
      this.client.set(key, val, cb);
    } else {
      this.client.setex(key, (ttl || 60), val, cb);
    }
  }

  /**
   * Delete entry. Supported glob-style patterns.
   *
   * @param {String} key
   * @param {Function} fn
   * @api private
   */

  _del(key, fn = noop) {
    this.client.keys(key, (err, data) => {
      if (err) return fn(err);
      let count = data.length;
      if (count === 0) return fn(null, null);
      data.forEach((key) => {
        this.client.del(key, (err, data) => {
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
  }

  /**
   * Delete an entry (Supported glob-style patterns).
   *
   * @param {String} key
   * @param {Function} fn
   * @api public
   */

  del(key, fn = noop) {
    this._del(key, fn);
  }

  /**
   * Clear all entries for this key in cache.
   *
   * @param {String} key
   * @param {Function} fn
   * @api public
   */

  clear(key = '', fn = noop) {

    if ('function' === typeof key) {
      fn = key;
      key = '';
    }

    this._del(`${key}*`, fn);
  }
}
