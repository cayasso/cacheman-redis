import assert from 'assert';
import redis from 'redis';
import Cache from '../lib/index';

const uri = 'redis://127.0.0.1:6379';
let cache;

describe('cacheman-redis', () => {

  before((done) => {
    cache = new Cache();
    done();
  });

  after((done) => {
    cache.clear(done);
  });

  it('should have main methods', () => {
    assert.ok(cache.set);
    assert.ok(cache.get);
    assert.ok(cache.del);
    assert.ok(cache.clear);
  });

  it('should store items', (done) => {
    cache.set('test1', { a: 1 }, (err) => {
      if (err) return done(err);
      cache.get('test1', (err, data) => {
        if (err) return done(err);
        assert.equal(data.a, 1);
        done();
      });
    });
  });

  it('should store zero', (done) => {
    cache.set('test2', 0, (err) => {
      if (err) return done(err);
      cache.get('test2', (err, data) => {
        if (err) return done(err);
        assert.strictEqual(data, 0);
        done();
      });
    });
  });

  it('should store false', (done) => {
    cache.set('test3', false, (err) => {
      if (err) return done(err);
      cache.get('test3', (err, data) => {
        if (err) return done(err);
        assert.strictEqual(data, false);
        done();
      });
    });
  });

  it('should store null', (done) => {
    cache.set('test4', null, (err) => {
      if (err) return done(err);
      cache.get('test4', (err, data) => {
        if (err) return done(err);
        assert.strictEqual(data, null);
        done();
      });
    });
  });

  it('should delete items', (done) => {
    let value = Date.now();
    cache.set('test5', value, (err) => {
      if (err) return done(err);
      cache.get('test5', (err, data) => {
        if (err) return done(err);
        assert.equal(data, value);
        cache.del('test5', (err) => {
          if (err) return done(err);
          cache.get('test5', (err, data) => {
            if (err) return done(err);
            assert.equal(data, null);
            done();
          });
        });
      });
    });
  });

  it('should delete items with glob-style patterns', (done) => {
    let value = Date.now();
    cache.set('foo_1', value, (err) => {
      if (err) return done(err);
      cache.set('foo_2', value, (err) => {
        if (err) return done(err);
        cache.get('foo_1', (err, data) => {
          if (err) return done(err);
          assert.equal(data, value);
          cache.del('foo*', (err) => {
            if (err) return done(err);
            cache.get('foo_1', (err, data) => {
              if (err) return done(err);
              assert.equal(data, null);
              cache.get('foo_2', (err, data) => {
                if (err) return done(err);
                assert.equal(data, null);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should clear items', (done) => {
    let value = Date.now();
    cache.set('test6', value, (err) => {
      if (err) return done(err);
      cache.get('test6', (err, data) => {
        if (err) return done(err);
        assert.equal(data, value);
        cache.clear((err) => {
          if (err) return done(err);
          cache.get('test6', (err, data) => {
            if (err) return done(err);
            assert.equal(data, null);
            done();
          });
        });
      });
    });
  });

  it('should expire key', function (done) {
    this.timeout(0);
    cache.set('test7', { a: 1 }, 1, (err) => {
      if (err) return done(err);
      setTimeout(() => {
        cache.get('test7', (err, data) => {
        if (err) return done(err);
          assert.equal(data, null);
          done();
        });
      }, 1100);
    });
  });

  it('should not expire key', function (done) {
    this.timeout(0);
    cache.set('test8', { a: 1 }, -1, (err) => {
      if (err) return done(err);
      setTimeout(() => {
        cache.get('test8', (err, data) => {
        if (err) return done(err);
          assert.deepEqual(data, { a: 1 });
          done();
        });
      }, 1000);
    });
  });

  it('should get the same value subsequently', (done) => {
    let val = 'Test Value';
    cache.set('test', 'Test Value', () => {
      cache.get('test', (err, data) => {
        if (err) return done(err);
        assert.strictEqual(data, val);
        cache.get('test', (err, data) => {
          if (err) return done(err);
          assert.strictEqual(data, val);
          cache.get('test', (err, data) => {
            if (err) return done(err);
             assert.strictEqual(data, val);
             done();
          });
        });
      });
    });
  });

  it('should allow passing redis connection string', (done) => {
    cache = new Cache(uri);
    cache.set('test9', { a: 1 }, (err) => {
      if (err) return done(err);
      cache.get('test9', (err, data) => {
        if (err) return done(err);
        assert.equal(data.a, 1);
        done();
      });
    });
  });

  it('should allow passing redis client as first argument', (done) => {
    let client = redis.createClient();
    cache = new Cache(client);
    cache.set('test10', { a: 1 }, (err) => {
      if (err) return done(err);
      cache.get('test10', (err, data) => {
        if (err) return done(err);
        assert.equal(data.a, 1);
        done();
      });
    });
  });

  it('should allow passing redis client as client in options', (done) => {
    let client = redis.createClient();
    cache = new Cache({ client: client });
    cache.set('test11', { a: 1 }, (err) => {
      if (err) return done(err);
      cache.get('test11', (err, data) => {
        if (err) return done(err);
        assert.equal(data.a, 1);
        done();
      });
    });
  });

  it('should clear an empty cache', (done) => {
    cache.clear((err, data) => {
      done();
    });
  });

});
