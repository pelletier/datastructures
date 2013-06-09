(function() {
  var ArrayTree, Binding, DS, Executor, Represented, WORKER,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  if (this.WORKER === void 0) {
    this.WORKER = {};
  }

  WORKER = this.WORKER;

  this.WORKER.Represented = (function() {
    function Represented() {}

    Represented.prototype.represent_as = function(interface_name) {
      WORKER.manager.register(this, interface_name);
      this.notify();
      return this;
    };

    Represented.prototype.notify = function() {
      return WORKER.manager.notify(this);
    };

    return Represented;

  })();

  if (this.WORKER === void 0) {
    this.WORKER = {
      interfaces: {}
    };
  }

  WORKER = this.WORKER;

  Binding = (function() {
    function Binding(object, id, _interface) {
      this.object = object;
      this.id = id;
      this["interface"] = _interface;
    }

    return Binding;

  })();

  this.WORKER.WorkerDSManager = (function() {
    function WorkerDSManager() {
      if (WORKER['interfaces'] === void 0) {
        WORKER.interfaces = {};
      }
      this.interfaces = WORKER.interfaces;
      this.counter = 0;
      this.bindings = [];
    }

    WorkerDSManager.prototype.register = function(object, interface_name) {
      this.counter += 1;
      this.bindings.push(new Binding(object, this.counter, interface_name));
      return this.send({
        id: this.counter,
        kind: 'register',
        "interface": interface_name
      });
    };

    WorkerDSManager.prototype.notify = function(object) {
      var binding, _i, _len, _ref, _results;
      _ref = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        binding = _ref[_i];
        if (binding.object === object) {
          _results.push(this.send({
            id: binding.id,
            kind: 'update',
            data: WORKER.interfaces[binding["interface"]].process(binding.object)
          }));
        }
      }
      return _results;
    };

    WorkerDSManager.prototype.send = function(data) {
      return WORKER.mediator.send('manager', data);
    };

    return WorkerDSManager;

  })();

  if (this.WORKER === void 0) {
    this.WORKER = {};
  }

  if (this.WORKER.interfaces === void 0) {
    this.WORKER.interfaces = {};
  }

  ArrayTree = (function() {
    function ArrayTree() {}

    ArrayTree.prototype.process = function(array) {
      this.array = array;
      return this.to_array(0);
    };

    ArrayTree.prototype.to_array = function(i) {
      var left_child, right_child, root;
      if (i >= this.array.length) {
        return null;
      }
      root = {
        name: this.array[i].toString(),
        children: []
      };
      left_child = this.to_array(2 * i + 1);
      right_child = this.to_array(2 * i + 2);
      if (left_child) {
        root.children.push(left_child);
      }
      if (right_child) {
        root.children.push(right_child);
      }
      return root;
    };

    return ArrayTree;

  })();

  this.WORKER.interfaces['array_tree'] = new ArrayTree();

  if (this.WORKER === void 0) {
    this.WORKER = {};
  }

  WORKER = this.WORKER;

  this.WORKER.Mediator = (function() {
    function Mediator() {
      self.addEventListener('message', this.receive, false);
    }

    Mediator.prototype.receive = function(event) {
      var data;
      data = JSON.parse(event.data);
      switch (data.action) {
        case "perform":
          return WORKER.executor.run(data.lines);
      }
    };

    Mediator.prototype.send = function(type, data) {
      return self.postMessage(JSON.stringify({
        type: type,
        data: data
      }));
    };

    return Mediator;

  })();

  if (this.DS === void 0) {
    this.DS = {};
  }

  if (this.WORKER === void 0) {
    Represented = (function() {
      function Represented() {}

      Represented.prototype.notify = function() {};

      return Represented;

    })();
    this.WORKER = {
      Represented: Represented
    };
  }

  this.DS.Array = (function(_super) {
    __extends(Array, _super);

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
      if (this.length !== 0) {
        this.notify();
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
      this.length += 1;
      return this.notify();
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
      this.length -= 1;
      return this.notify();
    };

    Array.prototype.drop_last = function() {
      return this.drop(this.length - 1);
    };

    Array.prototype.swap = function(i, j) {
      var _ref;
      if (!this.valid_bounds(i, j)) {
        return;
      }
      _ref = [this[j], this[i]], this[i] = _ref[0], this[j] = _ref[1];
      return this.notify();
    };

    Array.prototype.valid_bounds = function() {
      var indexes;
      indexes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return Math.min.apply(Math, indexes) >= 0 && Math.max.apply(Math, indexes) < this.length;
    };

    return Array;

  })(this.WORKER.Represented);

  if (this.WORKER === void 0) {
    this.WORKER = {};
  }

  if (this.DS === void 0) {
    this.DS = {};
  }

  DS = this.DS;

  WORKER = this.WORKER;

  Executor = (function() {
    function Executor() {}

    Executor.prototype.run = function(code) {
      var context, p;
      this.code = code;
      context = {};
      for (p in this) {
        context[p] = void 0;
      }
      context['console'] = this._console;
      context['update'] = this._update;
      context['_send'] = this._send;
      context['DS'] = DS;
      (new Function("with(this) { " + (this.code.join('\n')) + " }")).call(context);
      return this._send('run', 'done');
    };

    Executor.prototype._console = {
      log: function(msg) {
        return WORKER.mediator.send('exec', {
          kind: 'log',
          data: msg
        });
      }
    };

    Executor.prototype._update = function(i) {
      return this._send('update', {
        line: i
      });
    };

    Executor.prototype._send = function(kind, data) {
      return WORKER.mediator.send('exec', {
        kind: kind,
        data: data
      });
    };

    return Executor;

  })();

  if (this.WORKER === void 0) {
    self.postMessage(JSON.stringify({
      type: 'fatal',
      data: 'bad worker.js file'
    }));
    self.close();
  }

  this.WORKER.mediator = new this.WORKER.Mediator();

  this.WORKER.executor = new Executor();

  this.WORKER.manager = new this.WORKER.WorkerDSManager();

  this.WORKER.mediator.send('main', 'ready');

}).call(this);

/*
//@ sourceMappingURL=worker.js.map
*/