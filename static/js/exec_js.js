(function() {
  var editor, get_parameter, load_code, log, running, worker,
    _this = this;

  editor = null;

  worker = null;

  running = false;

  log = function(msg) {
    var output;

    output = $("#output");
    return output.val(output.val() + msg + '\n');
  };

  load_code = function(name) {
    var _this = this;

    return $.ajax(name, {
      dataType: "text"
    }).done(function(msg) {
      editor.setValue(msg);
      return editor.gotoLine(1);
    });
  };

  get_parameter = function(name) {
    var regex, results;

    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    results = regex.exec(location.search);
    return decodeURIComponent(results[1].replace(/\+/g, " "));
  };

  $(document).ready(function() {
    console.log('ready');
    if (typeof Worker === void 0) {
      alert("Your browser does not support web workers.\nGo home, dinausaur!");
      return;
    }
    editor = ace.edit('code');
    editor.getSession().setUseWorker(false);
    editor.setTheme('ace/theme/xcode');
    editor.getSession().setMode('ace/mode/javascript');
    load_code("../algorithms/" + (get_parameter('file')));
    return $("#start").click(function() {
      var index, line, lines, ln, running_lines, speed, tline, _i, _j, _len, _len1;

      if (running) {
        return false;
      }
      editor.getSession().clearAnnotations();
      $('#output').val('');
      lines = editor.getSession().getDocument().getAllLines().slice(0);
      console.log(lines);
      for (index = _i = 0, _len = lines.length; _i < _len; index = ++_i) {
        line = lines[index];
        line = $.trim(line);
        if (!line.match(/^((.*(;|{|}))||\/\/.*)$/)) {
          ln = index + 1;
          log("Line " + ln + " does not ends with any of [';', '{', '}']. Abort.");
          log("-> " + line);
          editor.getSession().setAnnotations([
            {
              row: ln - 1,
              column: line.length,
              text: "Bad line",
              type: "error"
            }
          ]);
          return;
        }
      }
      running_lines = [];
      for (index = _j = 0, _len1 = lines.length; _j < _len1; index = ++_j) {
        line = lines[index];
        running_lines.push(line);
        tline = $.trim(line);
        if (!(tline.match(/^}?$/) || tline.match(/^\/\/.*$/))) {
          running_lines.push("update(" + index + ");");
        }
      }
      console.log(running_lines.join('\n'));
      speed = parseFloat($("#speed option:selected").val());
      worker = new Worker('/static/js/worker.js');
      return worker.onmessage = function(event) {
        var data, payload;

        data = JSON.parse(event.data);
        console.log(data);
        switch (data.action) {
          case "ready":
            payload = {
              'action': 'perform',
              'lines': running_lines,
              'speed': speed
            };
            worker.postMessage(JSON.stringify(payload));
            $("#start").html('<i class="icon-spinner icon-spin icon-large"></i> Running...');
            running = true;
            editor.setReadOnly(true);
            return $("#speed").attr('disabled', true);
          case "done":
            console.log("computation completed");
            $("#start").html('<i class="icon-play"></i> Run</a>');
            running = false;
            editor.setReadOnly(false);
            return $("#speed").removeAttr('disabled');
          case "console":
            console.log("console: " + data.data);
            return log(data.data);
          case "line":
            console.log("move to line: " + data.data);
            editor.setHighlightActiveLine(true);
            return editor.gotoLine(data.data + 1, 0, false);
          default:
            return console.log("unhandled message");
        }
      };
    });
  });

}).call(this);
