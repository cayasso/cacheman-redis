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

    const { port, host, client, setex, password, database, prefix } = options;
 
    if ('string' === typeof options) {
      options = parse(options);
    }

    if ('function' === typeof setex) {
      this.client = options;
    } else if (client) {
      this.client = client;
    }  else if (!port && !host) {
      this.client = new redis.createClient();
    } else {
      this.client = new redis.createClient(port, host, { ...options, prefix: null });
    }

    if (password) {
      this.client.auth(password, err => {
        if (err) throw err;
      });
    }

    if (database) {
      this.client.select(database, err => {
        if (err) throw err;
      });
    }

    this.prefix = prefix || 'cacheman:';
  }

  /**
   * Get an entry.
   *
   * @param {String} key
   * @param {Function} fn
   * @api public
   */

  get(key, fn = noop) {
    const k = `${this.prefix}${key}`;
    this.client.get(k, (err, data) => {
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
    const k = `${this.prefix}${key}`;

    if ('function' === typeof ttl) {
      fn = ttl;
      ttl = null;
    }

    try {
      val = JSON.stringify(val)
    } catch (e) {
      return fn(e);
    }

    const cb = err => {
      if (err) return fn(err);
      fn(null, val);
    }

    if (-1 === ttl) {
      this.client.set(k, val, cb);
    } else {
      this.client.setex(k, (ttl || 60), val, cb);
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
      data.forEach(key => {
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
    this._del(`${this.prefix}${key}`, fn);
  }

  /**
   * Clear all entries for this key in cache.
   *
   * @param {String} key
   * @param {Function} fn
   * @api public
   */

  clear(fn = noop) {
    this._del(`${this.prefix}*`, fn);
  }
}
