(function() {
  var __slice = [].slice;

  this.Array = (function() {
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

      if (!valid_bounds(index)) {
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
      return drop(this.length - 1);
    };

    Array.prototype.swap = function(i, j) {
      var _ref;

      if (!valid_bounds(i, j)) {
        return;
      }
      return _ref = [this[j], this[i]], this[i] = _ref[0], this[j] = _ref[1], _ref;
    };

    Array.prototype.valid_bounds = function() {
      var indexes;

      indexes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return Math.min.apply(Math, indexes) < 0 || Math.max.apply(Math, indexes) >= this.length;
    };

    return Array;

  })();

}).call(this);
