import assert from 'assert';
import redis from 'redis';
import Cache from '../lib/index';


const uri = 'redis://127.0.0.1:6379';
let cache;

describe('cacheman-redis', function () {

  before(function(done){
    cache = new Cache({}, {});
    done();
  });

  after(function(done){
    cache.clear(done);
  });

  it('should have main methods', function () {
    assert.ok(cache.set);
    assert.ok(cache.get);
    assert.ok(cache.del);
    assert.ok(cache.clear);
  });
    
  it('should store items', function (done) {
    cache.set('test1', { a: 1 }, function (err) {
      if (err) return done(err);
      cache.get('test1', function (err, data) {
        if (err) return done(err);
        assert.equal(data.a, 1);
        done();
      });
    });
  });

  it('should store zero', function (done) {
    cache.set('test2', 0, function (err) {
      if (err) return done(err);
      cache.get('test2', function (err, data) {
        if (err) return done(err);
        assert.strictEqual(data, 0);
        done();
      });
    });
  });

  it('should store false', function (done) {
    cache.set('test3', false, function (err) {
      if (err) return done(err);
      cache.get('test3', function (err, data) {
        if (err) return done(err);
        assert.strictEqual(data, false);
        done();
      });
    });
  });

  it('should store null', function (done) {
    cache.set('test4', null, function (err) {
      if (err) return done(err);
      cache.get('test4', function (err, data) {
        if (err) return done(err);
        assert.strictEqual(data, null);
        done();
      });
    });
  });

  it('should delete items', function (done) {
    let value = Date.now();
    cache.set('test5', value, function (err) {
      if (err) return done(err);
      cache.get('test5', function (err, data) {
        if (err) return done(err);
        assert.equal(data, value);
        cache.del('test5', function (err) {
          if (err) return done(err);
          cache.get('test5', function (err, data) {
            if (err) return done(err);
            assert.equal(data, null);
            done();
          });
        });
      });
    });
  });

  it('should clear items', function (done) {
    let value = Date.now();
    cache.set('test6', value, function (err) {
      if (err) return done(err);
      cache.get('test6', function (err, data) {
        if (err) return done(err);
        assert.equal(data, value);
        cache.clear(function (err) {
          if (err) return done(err);
          cache.get('test6', function (err, data) {
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
    cache.set('test7', { a: 1 }, 1, function (err) {
      if (err) return done(err);
      setTimeout(function () {
        cache.get('test7', function (err, data) {
        if (err) return done(err);
          assert.equal(data, null);
          done();
        });
      }, 1100);
    });
  });

  it('should not expire key', function (done) {
    this.timeout(0);
    cache.set('test8', { a: 1 }, -1, function (err) {
      if (err) return done(err);
      setTimeout(function () {
        cache.get('test8', function (err, data) {
        if (err) return done(err);
          assert.deepEqual(data, { a: 1 });
          done();
        });
      }, 1000);
    });
  });

  it('should get the same value subsequently', function(done) {
    let val = 'Test Value';
    cache.set('test', 'Test Value', function() {
      cache.get('test', function(err, data) {
        if (err) return done(err);
        assert.strictEqual(data, val);
        cache.get('test', function(err, data) {
          if (err) return done(err);
          assert.strictEqual(data, val);
          cache.get('test', function(err, data) {
            if (err) return done(err);
             assert.strictEqual(data, val);
             done();
          });
        });
      });
    });
  });


  it('should allow passing redis connection string', function (done) {
    cache = new Cache(uri);
    cache.set('test9', { a: 1 }, function (err) {
      if (err) return done(err);
      cache.get('test9', function (err, data) {
        if (err) return done(err);
        assert.equal(data.a, 1);
        done();
      });
    });
  });

  it('should allow passing redis client as first argument', function (done) {
    let client = redis.createClient();
    cache = new Cache(client);
    cache.set('test10', { a: 1 }, function (err) {
      if (err) return done(err);
      cache.get('test10', function (err, data) {
        if (err) return done(err);
        assert.equal(data.a, 1);
        done();
      });
    });
  });

  it('should allow passing redis client as client in options', function (done) {
    let client = redis.createClient();
    cache = new Cache({ client: client });
    cache.set('test11', { a: 1 }, function (err) {
      if (err) return done(err);
      cache.get('test11', function (err, data) {
        if (err) return done(err);
        assert.equal(data.a, 1);
        done();
      });
    });
  });

  it('should clear an empty cache', function(done) {
    cache.clear(function(err, data) {
      done();
    });
  });

});
