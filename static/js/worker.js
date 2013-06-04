(function() {
  var console, console_msg, done_msg, line_msg, postData, ready_msg, run, sleep, speed, update,
    __slice = [].slice,
    _this = this;

  if (this.DS === void 0) {
    this.DS = {};
  }

  this.DS.Array = (function() {
    function Array(init) {
      var index, val, _i, _len;
      this.length = 0;
      if (init !== void 0) {
        for (index = _i = 0, _len = init.length; _i < _len; index = ++_i) {
          val = init[index];
          this[index] = val;
        }
        this.length = init.length;
      }
    }

    Array.prototype.keys = function() {
      var _i, _ref, _results;
      return (function() {
        _results = [];
        for (var _i = 0, _ref = this.length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this);
    };

    Array.prototype.push = function(value) {
      this[this.length] = value;
      return this.length += 1;
    };

    Array.prototype.drop = function(index) {
      var i, _i, _ref, _ref1;
      if (!this.valid_bounds(index)) {
        return;
      }
      if (index !== this.length - 1) {
        for (i = _i = _ref = index + 1, _ref1 = this.length; _ref <= _ref1 ? _i < _ref1 : _i > _ref1; i = _ref <= _ref1 ? ++_i : --_i) {
          this[i - 1] = this[i];
        }
      }
      this[this.length - 1] = void 0;
      return this.length -= 1;
    };

    Array.prototype.drop_last = function() {
      return this.drop(this.length - 1);
    };

    Array.prototype.swap = function(i, j) {
      var _ref;
      if (!this.valid_bounds(i, j)) {
        return;
      }
      return _ref = [this[j], this[i]], this[i] = _ref[0], this[j] = _ref[1], _ref;
    };

    Array.prototype.valid_bounds = function() {
      var indexes;
      indexes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return Math.min.apply(Math, indexes) >= 0 && Math.max.apply(Math, indexes) < this.length;
    };

    return Array;

  })();

  speed = 0;

  postData = function(data) {
    return self.postMessage(JSON.stringify(data));
  };

  ready_msg = function() {
    return {
      action: 'ready'
    };
  };

  done_msg = function() {
    return {
      action: 'done'
    };
  };

  console_msg = function(msg) {
    return {
      action: 'console',
      data: msg
    };
  };

  line_msg = function(i) {
    return {
      action: 'line',
      data: i
    };
  };

  sleep = function(amount) {
    var start, _results;
    start = new Date().getTime();
    _results = [];
    while (true) {
      if ((new Date().getTime() - start) > amount) {
        break;
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  console = {
    log: function(msg) {
      return postData(console_msg(msg));
    }
  };

  update = function(i) {
    postData(line_msg(i));
    return sleep(speed);
  };

  run = function(rlines) {
    var context, p;
    context = {};
    for (p in this) {
      context[p] = void 0;
    }
    context['console'] = console;
    context['update'] = update;
    context['DS'] = this.DS;
    (new Function("with(this) { " + (rlines.join('\n')) + " }")).call(context);
    return postData(done_msg());
  };

  self.addEventListener('message', function(event) {
    var data;
    data = JSON.parse(event.data);
    if (data.action === 'perform') {
      speed = data.speed * 1000;
      return run(data.lines);
    } else {
      return console.log("unknown message: " + data);
    }
  }, false);

  postData(ready_msg());

}).call(this);

/*
//@ sourceMappingURL=worker.js.map
*/