'use strict'

/**
 * Module dependencies.
 */

const redis = require('redis')
const parser = require('parse-redis-url')
const each = require('each')

/**
 * Module constants.
 */

const parse = parser(redis).parse
const noop = () => {}

class RedisStore {
  /**
   * RedisStore constructor.
   *
   * @param {String|Object} options
   * @api public
   */

  constructor(options = {}) {
    if ('string' === typeof options) {
      options = parse(options)
    }

    const { port, host, client, setex, password, database, prefix } = options

    if ('function' === typeof setex) {
      this.client = options
    } else if (client) {
      this.client = client
    } else if (!port && !host) {
      this.client = redis.createClient()
    } else {
      const opts = Object.assign({}, options, { prefix: null })
      this.client = redis.createClient(port, host, opts)
    }

    if (password) {
      this.client.auth(password, (err) => {
        if (err) throw err
      })
    }

    if (database) {
      this.client.select(database, (err) => {
        if (err) throw err
      })
    }

    this.prefix = prefix || 'cacheman:'
  }

  /**
   * Get an entry.
   *
   * @param {String} key
   * @param {Function} fn
   * @api public
   */

  get(key, fn = noop) {
    const k = `${this.prefix}${key}`
    this.client.get(k, (err, data) => {
      if (err) return fn(err)
      if (!data) return fn(null, null)
      data = data.toString()
      try {
        fn(null, JSON.parse(data))
      } catch (e) {
        fn(e)
      }
    })
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
    const k = `${this.prefix}${key}`

    if ('function' === typeof ttl) {
      fn = ttl
      ttl = null
    }

    try {
      val = JSON.stringify(val)
    } catch (e) {
      return fn(e)
    }

    const cb = (err) => {
      if (err) return fn(err)
      fn(null, val)
    }

    if (-1 === ttl) {
      this.client.set(k, val, cb)
    } else {
      this.client.setex(k, ttl || 60, val, cb)
    }
  }

  /**
   * Delete an entry (Supported glob-style patterns).
   *
   * @param {String} key
   * @param {Function} fn
   * @api public
   */

  del(key, fn = noop) {
    this.client.del(`${this.prefix}${key}`, fn)
  }

  /**
   * Clear all entries in cache.
   *
   * @param {Function} fn
   * @api public
   */

  clear(fn = noop) {
    this.client.keys(`${this.prefix}*`, (err, data) => {
      if (err) return fn(err)
      let count = data.length
      if (count === 0) return fn(null, null)
      data.forEach((key) => {
        this.client.del(key, (err) => {
          if (err) {
            count = 0
            return fn(err)
          }
          if (--count == 0) {
            fn(null, null)
          }
        })
      })
    })
  }

  /**
   * Scan for a number of entries from a cursor point
   *
   * @param {Number}   cursor
   * @param {Number}   fn
   * @param {Function} fn
   * @api public
   */

  scan(cursor, count = 10, fn = noop) {
    const entries = []
    const prefix = this.prefix
    const self = this

    this.client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', count, (err, data) => {
      if (err) return fn(err)

      const [newCursor, keys] = data

      each(keys).call((key, index, next) => {
        const _key = key.replace(`${this.prefix}`, '')

        self.get(_key, (err, data) => {
          if (err) return fn(err)

          entries.push({ key: _key, data })
          next()
        })
      }).next(() => {
        fn(null, { cursor: Number(newCursor), entries })
      })
    })
  }
}

module.exports = RedisStore
