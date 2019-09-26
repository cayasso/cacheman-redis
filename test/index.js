const assert = require('assert')
const redis = require('redis')
const Cache = require('../src')

const uri = 'redis://127.0.0.1:6379/5'
const connection = {
  host: '127.0.0.1',
  port: 6379,
  database: 6
}

describe('cacheman-redis', () => {
  let cache = null

  beforeEach((done) => {
    cache = new Cache({ prefix: 'cacheman-redis:test' })
    done()
  })

  afterEach((done) => {
    cache.clear(done)
  })

  it('should have main methods', () => {
    assert.ok(cache.set)
    assert.ok(cache.get)
    assert.ok(cache.del)
    assert.ok(cache.clear)
    assert.ok(cache.scan)
  })

  it('should store items', (done) => {
    cache.set('test1', { a: 1 }, (err) => {
      if (err) return done(err)
      cache.get('test1', (err, data) => {
        if (err) return done(err)
        assert.equal(data.a, 1)
        done()
      })
    })
  })

  it('should store zero', (done) => {
    cache.set('test2', 0, (err) => {
      if (err) return done(err)
      cache.get('test2', (err, data) => {
        if (err) return done(err)
        assert.strictEqual(data, 0)
        done()
      })
    })
  })

  it('should store false', (done) => {
    cache.set('test3', false, (err) => {
      if (err) return done(err)
      cache.get('test3', (err, data) => {
        if (err) return done(err)
        assert.strictEqual(data, false)
        done()
      })
    })
  })

  it('should store null', (done) => {
    cache.set('test4', null, (err) => {
      if (err) return done(err)
      cache.get('test4', (err, data) => {
        if (err) return done(err)
        assert.strictEqual(data, null)
        done()
      })
    })
  })

  it('should delete items', (done) => {
    let value = Date.now()
    cache.set('test5', value, (err) => {
      if (err) return done(err)
      cache.get('test5', (err, data) => {
        if (err) return done(err)
        assert.equal(data, value)
        cache.del('test5', (err) => {
          if (err) return done(err)
          cache.get('test5', (err, data) => {
            if (err) return done(err)
            assert.equal(data, null)
            done()
          })
        })
      })
    })
  })

  it('should clear items', (done) => {
    let value = Date.now()
    cache.set('test6', value, (err) => {
      if (err) return done(err)
      cache.get('test6', (err, data) => {
        if (err) return done(err)
        assert.equal(data, value)
        cache.clear((err) => {
          if (err) return done(err)
          cache.get('test6', (err, data) => {
            if (err) return done(err)
            assert.equal(data, null)
            done()
          })
        })
      })
    })
  })

  it('should expire key', function(done) {
    this.timeout(0)
    cache.set('test7', { a: 1 }, 1, (err) => {
      if (err) return done(err)
      setTimeout(() => {
        cache.get('test7', (err, data) => {
          if (err) return done(err)
          assert.equal(data, null)
          done()
        })
      }, 1100)
    })
  })

  it('should not expire key', function(done) {
    this.timeout(0)
    cache.set('test8', { a: 1 }, -1, (err) => {
      if (err) return done(err)
      setTimeout(() => {
        cache.get('test8', (err, data) => {
          if (err) return done(err)
          assert.deepEqual(data, { a: 1 })
          done()
        })
      }, 1000)
    })
  })

  it('should get the same value subsequently', (done) => {
    let val = 'Test Value'
    cache.set('test', 'Test Value', () => {
      cache.get('test', (err, data) => {
        if (err) return done(err)
        assert.strictEqual(data, val)
        cache.get('test', (err, data) => {
          if (err) return done(err)
          assert.strictEqual(data, val)
          cache.get('test', (err, data) => {
            if (err) return done(err)
            assert.strictEqual(data, val)
            done()
          })
        })
      })
    })
  })

  it('should allow passing redis connection params as object', (done) => {
    cache = new Cache(connection)
    cache.set('test9', { a: 1 }, (err) => {
      if (err) return done(err)
      cache.get('test9', (err, data) => {
        if (err) return done(err)
        assert.equal(data.a, 1)
        assert.equal(cache.client.selected_db, 6)
        done()
      })
    })
  })

  it('should allow passing redis connection string', (done) => {
    cache = new Cache(uri)
    cache.set('test10', { a: 1 }, (err) => {
      if (err) return done(err)
      cache.get('test10', (err, data) => {
        if (err) return done(err)
        assert.equal(data.a, 1)
        assert.equal(cache.client.selected_db, 5)
        done()
      })
    })
  })

  it('should allow passing redis client as first argument', (done) => {
    let client = redis.createClient()
    cache = new Cache(client)
    cache.set('test11', { a: 1 }, (err) => {
      if (err) return done(err)
      cache.get('test11', (err, data) => {
        if (err) return done(err)
        assert.equal(data.a, 1)
        done()
      })
    })
  })

  it('should allow passing redis client as client in options', (done) => {
    let client = redis.createClient()
    cache = new Cache({ client: client })
    cache.set('test12', { a: 1 }, (err) => {
      if (err) return done(err)
      cache.get('test12', (err, data) => {
        if (err) return done(err)
        assert.equal(data.a, 1)
        done()
      })
    })
  })

  it('should clear an empty cache', (done) => {
    cache.clear((err) => {
      done(err)
    })
  })

  it('should scan and return results', (done) => {
    const items = [
      { key: 'test0',  data: { a: 'test0' } },
      { key: 'test1',  data: { a: 'test1' } },
      { key: 'test2',  data: { a: 'test2' } },
      { key: 'test3',  data: { a: 'test3' } },
      { key: 'test4',  data: { a: 'test4' } },
      { key: 'test5',  data: { a: 'test5' } },
      { key: 'test6',  data: { a: 'test6' } },
      { key: 'test7',  data: { a: 'test7' } },
      { key: 'test8',  data: { a: 'test8' } },
      { key: 'test9',  data: { a: 'test9' } }
    ]

    const compare = (a, b) => {
      if (a.key < b.key) return -1
      else if (a.key > b.key) return 1
      else return 0;
    }

    items.forEach((obj, index) => {
      cache.set(obj.key, obj.data, (err) => {
        assert.deepEqual(null, err)
      })
    })

    cache.scan(0, 20, (err, result) => {
      assert.deepEqual(null, err)
      assert.equal(result.cursor, 0)

      const entries = result.entries.sort(compare)
      assert.deepEqual(items, entries)
      done()
    })
  })
})
