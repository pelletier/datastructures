(function() {
  var console, console_msg, done_msg, line_msg, postData, ready_msg, run, sleep, speed, update,
    _this = this;

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
