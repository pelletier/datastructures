(function() {
  var VizTree, editor, get_parameter, load_code, log, representations, running, worker,
    _this = this,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  editor = null;

  representations = null;

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
    load_code("../static/js/algorithms/" + (get_parameter('file')));
    return $("#start").click(function() {
      var index, line, lines, ln, running_lines, speed, states, timer, tline, update_func, visualizations, _i, _j, _len, _len1;
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
      speed = parseFloat($("#speed option:selected").val()) * 1000;
      states = [];
      timer = null;
      representations = {};
      visualizations = {
        "array_tree": VizTree
      };
      update_func = function() {
        var state;
        while (states.length > 0 && states[0]['line'] === void 0) {
          state = states.shift();
          if (state['log'] !== void 0) {
            log(state.log);
          } else if (state['repr_id'] !== void 0) {
            representations[state.repr_id].draw(state.data);
          }
        }
        if (states.length > 0) {
          state = states.shift();
          editor.setHighlightActiveLine(true);
          editor.gotoLine(state.line + 1, 0, false);
          return setTimeout(update_func, speed);
        } else if (running) {
          return setTimeout(update_func, speed);
        }
      };
      worker = new Worker('../static/js/worker.js');
      return worker.onmessage = function(event) {
        var data, payload;
        data = JSON.parse(event.data);
        console.log(data);
        switch (data.type) {
          case 'exec':
            switch (data.data.kind) {
              case 'log':
                console.log("console: " + data.data.data);
                return states.push({
                  log: data.data.data
                });
              case 'update':
                console.log("move to line: " + data.data.data.line);
                return states.push({
                  line: data.data.data.line
                });
              case "run":
                if (data.data.data === 'done') {
                  console.log("computation completed");
                  $("#start").html('<i class="icon-play"></i> Run</a>');
                  running = false;
                  editor.setReadOnly(false);
                  return $("#speed").removeAttr('disabled');
                }
            }
            break;
          case 'main':
            switch (data.data) {
              case 'ready':
                payload = {
                  'action': 'perform',
                  'lines': running_lines
                };
                worker.postMessage(JSON.stringify(payload));
                $("#start").html('<i class="icon-spinner icon-spin icon-large"></i> Running...');
                running = true;
                editor.setReadOnly(true);
                $("#speed").attr('disabled', true);
                return update_func();
            }
            break;
          case 'manager':
            console.log(data);
            switch (data.data.kind) {
              case 'register':
                console.log("registered " + data.data.id);
                return representations[data.data.id] = new visualizations[data.data["interface"]](speed);
              case 'update':
                console.log("updating " + data.data.id);
                return states.push({
                  repr_id: data.data.id,
                  data: data.data.data
                });
            }
        }
      };
    });
  });

  VizTree = (function() {
    function VizTree(speed) {
      var _this = this;
      this.speed = speed;
      this.compute_radius = __bind(this.compute_radius, this);
      this.width = 400;
      this.height = 400;
      this.svg = d3.select("#representations").append('div').attr('class', 'viz graph').append("svg").attr('width', this.width).attr('height', this.height).append('g').attr('transform', "translate(50,50)");
      this.tree = d3.layout.tree().size([this.width - 100, this.height - 100]).children(function(d) {
        if (d.children.length === 0) {
          return null;
        } else {
          return d.children;
        }
      }).separation(function(a, b) {
        _this.compute_radius(a);
        _this.compute_radius(b);
        return a.rad + b.rad + 10;
      });
    }

    VizTree.prototype.get_parent = function(el) {
      return d3.select(d3.select(el).node().parentNode);
    };

    VizTree.prototype.draw = function(data) {
      var bound, diag, links, nodeGroup, nodes,
        _this = this;
      bound = this;
      nodes = this.tree.nodes(data);
      links = this.tree.links(nodes);
      diag = d3.svg.diagonal().projection(function(d) {
        return [d.x, d.y];
      });
      this.svg.selectAll('path.link').data(links).enter().append('svg:path').attr('class', 'link').attr('d', diag);
      this.svg.selectAll('g.node').data(nodes).select('text').transition().text(function(d) {
        var old;
        old = d3.select(this).text();
        if (old !== d.name) {
          bound.get_parent(this).select('circle').classed('dirty', true);
        }
        return d.name;
      });
      this.svg.selectAll('g.node').data(nodes).select('circle.dirty').classed('dirty', false).transition().duration(this.speed / 2).style('fill', '#049cdb').transition().duration(this.speed / 2).style('fill', 'white');
      nodeGroup = this.svg.selectAll('g.node').data(nodes).enter().append('svg:g').attr('class', 'node').attr('transform', function(d) {
        return "translate(" + d.x + ", " + d.y + ")";
      });
      nodeGroup.append("svg:circle").attr("class", "node-dot").attr('r', this.compute_radius);
      return nodeGroup.append("svg:text").attr('x', function(d) {
        _this.compute_radius(d);
        console.log(d.rad);
        return -d.bbox.width / 2;
      }).attr('dy', function(d) {
        return 5;
      }).text(function(d) {
        return d.name;
      });
    };

    VizTree.prototype.compute_radius = function(d) {
      var bbox, rad;
      if (d.rad !== void 0) {
        return d.rad;
      }
      this.svg.append("svg:text").attr('class', 'tmp').text(d.name);
      bbox = this.svg.select('text.tmp')[0][0].getBBox();
      rad = (Math.max(bbox.width, bbox.height) + 20) / 2;
      this.svg.select('text.tmp').remove();
      d.rad = rad;
      d.bbox = bbox;
      return rad;
    };

    return VizTree;

  })();

}).call(this);

/*
//@ sourceMappingURL=exec.js.map
*/