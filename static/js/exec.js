(function() {
  var VizArray, VizTree, editor, get_parameter, load_code, log, representations, running, worker,
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
      $('#representations svg').remove();
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
        "array_tree": VizTree,
        "array_array": VizArray
      };
      update_func = function() {
        var state;
        while (states.length > 0 && states[0]['line'] === void 0) {
          state = states.shift();
          if (state['log'] !== void 0) {
            log(state.log);
          } else if (state['repr_id'] !== void 0) {
            representations[state.repr_id].draw(state.data);
          } else if (state['exec'] !== void 0) {
            console.log("computation completed");
            $("#start").html('<i class="icon-play"></i> Run</a>');
            running = false;
            editor.setReadOnly(false);
            $("#speed").removeAttr('disabled');
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
        var data, height, payload, width;
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
                  return states.push({
                    exec: 'done'
                  });
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
                height = 400;
                width = 390;
                return representations[data.data.id] = new visualizations[data.data["interface"]](speed, width, height);
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
    function VizTree(speed, width, height) {
      var _this = this;
      this.speed = speed;
      this.width = width;
      this.height = height;
      this.compute_radius = __bind(this.compute_radius, this);
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
      this.diagonal = d3.svg.diagonal();
    }

    VizTree.prototype.resize = function(width, height) {
      this.width = width;
      this.height = height;
    };

    VizTree.prototype.get_parent = function(el) {
      return d3.select(d3.select(el).node().parentNode);
    };

    VizTree.prototype.null_diagonal = function(d) {
      var o;
      o = {
        x: d.source.x,
        y: d.source.y
      };
      return d3.svg.diagonal()({
        source: o,
        target: o
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

    VizTree.prototype.draw = function(data) {
      var bound, exited, links, max_step, min_zero, nodes, nodes_group, step, t0, t1, t2,
        _this = this;
      if (data === null) {
        this.svg.selectAll('*').remove();
        return;
      }
      bound = this;
      nodes = this.tree.nodes(data);
      links = this.tree.links(nodes);
      exited = false;
      nodes_group = this.svg.selectAll('g.node').data(nodes).enter().append('svg:g').attr('class', 'node').attr('transform', function(d) {
        return "translate(" + d.x + ", " + d.y + ")";
      });
      nodes_group.append('svg:circle').attr('class', 'circle').attr('r', 0);
      nodes_group.append('svg:text').style('opacity', 0);
      this.svg.selectAll('g.node').data(nodes).select('text').text(function(d) {
        var old, that;
        that = d3.select(this);
        old = that.text();
        if (old !== d.name) {
          bound.get_parent(this).select('circle').classed('dirty', true);
        }
        return d.name;
      });
      this.svg.selectAll('path.link').data(links).exit().classed('remove', true).classed('ready', false).each(function() {
        return exited = true;
      });
      this.svg.selectAll('g.node').data(nodes).exit().classed('remove', true).each(function() {
        return exited = true;
      });
      this.svg.selectAll('path.link').data(links).enter().insert('svg:path', 'g.node').attr('class', 'link').attr('d', this.null_diagonal);
      step = this.speed * 2;
      max_step = function(x) {
        if (x > step) {
          return step;
        } else {
          return x;
        }
      };
      min_zero = function(x) {
        if (x < 0) {
          return 0;
        } else {
          return x;
        }
      };
      t0 = this.svg;
      if (exited) {
        t0 = this.svg.transition().duration(step);
        t0.selectAll('.link.remove').attr('d', this.null_diagonal);
        t0.selectAll('.node.remove').style('opacity', 0);
      }
      t1 = t0.transition().duration(step);
      t1.selectAll('.node').attr('transform', function(d) {
        return "translate(" + d.x + ", " + d.y + ")";
      });
      t1.selectAll('.node circle.dirty').style('fill', '#049cdb');
      t1.selectAll('.link.ready').attr('d', this.diagonal);
      t2 = t1.transition().duration(step);
      t2.selectAll('.node circle').attr('r', this.compute_radius);
      t2.selectAll('.node text').attr('x', function(d) {
        _this.compute_radius(d);
        return -d.bbox.width / 2;
      }).attr('dy', function(d) {
        return 5;
      }).delay(max_step((exited ? 2 * step : step) + 300)).duration(min_zero(step - 300)).style('opacity', 1);
      t2.selectAll('.link:not(.remove)').attr('d', this.diagonal).each(function(d) {
        return d3.select(this).classed('ready', true);
      });
      t2.selectAll('.node circle.dirty').style('fill', 'white').each(function(d) {
        return d3.select(this).classed('dirty', false);
      });
      return t2.each('end', function() {
        return bound.svg.selectAll('.remove').remove();
      });
    };

    return VizTree;

  })();

  VizArray = (function() {
    function VizArray(speed, width, height) {
      this.speed = speed;
      this.width = width;
      this.height = height;
      this.xspacing = 10;
      this.yspacing = 10;
      this.xmargin = 10;
      this.ymargin = 10;
      this.inode = 0;
      this.old_data = null;
      this.svg = d3.select("#representations").append('div').attr('class', 'viz array').append("svg").attr('width', this.width).attr('height', this.height).append('g').attr('transform', "translate(" + this.xmargin + "," + this.ymargin + ")");
    }

    VizArray.prototype.resize = function(width, height) {
      this.width = width;
      this.height = height;
    };

    VizArray.prototype.compute_radius = function(d, size) {
      var bbox, rad;
      this.svg.append("svg:text").attr('class', 'tmp').text(d).style('font-size', "" + size + "px");
      bbox = this.svg.select('text.tmp')[0][0].getBBox();
      rad = (Math.max(bbox.width, bbox.height) + Math.max(this.xspacing, this.yspacing) * 2) / 2;
      this.svg.select('text.tmp').remove();
      return bbox;
    };

    VizArray.prototype.morph_data = function(data, old_data) {
      var i, _i, _j, _k, _l, _ref, _ref1, _ref2, _ref3;
      old_data = old_data || [];
      if (old_data.length === data.length) {
        for (i = _i = 0, _ref = data.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          old_data[i].value = data[i];
        }
      } else if (old_data.length < data.length) {
        for (i = _j = 0, _ref1 = data.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          if (i === old_data.length || data[i] !== old_data[i].value) {
            old_data.splice(i, 0, {
              value: data[i],
              inode: this.inode++
            });
            break;
          }
        }
      } else {
        for (i = _k = 0, _ref2 = old_data.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
          if (data[i] !== old_data[i].value) {
            old_data.splice(i, 1);
            break;
          }
        }
      }
      for (i = _l = 0, _ref3 = old_data.length; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; i = 0 <= _ref3 ? ++_l : --_l) {
        old_data[i].index = i;
      }
      return old_data;
    };

    VizArray.prototype.draw = function(data) {
      var block_x, block_y, exited, fsize, new_data, rectGroup, sel, size, step, t0, t1, x_level, y_level,
        _this = this;
      new_data = this.morph_data(data, this.old_data);
      this.old_data = new_data;
      data = new_data;
      block_x = (this.width - 2 * this.xmargin - (data.length - 1) * this.xspacing) / data.length;
      block_y = (this.height - 2 * this.ymargin - 2 * this.yspacing) / 3;
      size = Math.min(block_x, block_y);
      fsize = Math.floor(size / 4);
      y_level = function(i) {
        return i * (_this.yspacing + size);
      };
      x_level = function(i) {
        return i * (_this.xspacing + size);
      };
      sel = function(d) {
        return d.inode;
      };
      exited = false;
      this.svg.selectAll('g.rect').data(data, sel).exit().attr('target_y', y_level(2)).attr('exit', true).each(function() {
        return exited = true;
      });
      rectGroup = this.svg.selectAll('g.rect').data(data, sel).enter().append('svg:g').attr('class', 'rect').attr('y', y_level(0)).attr('x', x_level(0)).attr('target_y', y_level(1)).attr('target_x', function(d, i) {
        return x_level(d.index);
      });
      rectGroup.append('svg:rect').attr('width', size).attr('height', size);
      rectGroup.append('svg:text').text(function(d) {
        return d.value;
      }).style('font-size', fsize + 'px').attr('x', function(d) {
        var rad;
        rad = _this.compute_radius(d.value, fsize);
        return -rad.width / 2 + size / 2;
      }).attr('y', function(d) {
        var rad;
        rad = _this.compute_radius(d.value, fsize);
        return size / 2 + rad.height / 4;
      });
      step = this.speed * 2;
      t0 = this.svg.transition().duration(step);
      if (exited) {
        t0.selectAll('g.rect[exit]').attr('transform', function(d, i) {
          var v, x;
          v = d3.select(this).attr('target_y');
          x = d3.select(this).attr('x');
          d3.select(this).attr('y', v);
          return "translate(" + x + ", " + v + ")";
        }).style('opacity', function(d) {
          var _ref;
          return (_ref = d3.select(this).attr('exit')) != null ? _ref : {
            0: 1
          };
        });
        t0 = t0.transition().duration(step);
      }
      t0.selectAll('g.rect').attr('transform', function(d, i) {
        var v, y;
        v = d3.select(this).attr('target_x') || x_level(d.index);
        y = d3.select(this).attr('y');
        d3.select(this).attr('target_x', null);
        d3.select(this).attr('x', v);
        return "translate(" + v + "," + y + ")";
      }).select('text').text(function(d) {
        return d.value;
      }).style('font-size', fsize + 'px').attr('x', function(d) {
        return -_this.compute_radius(d.value, fsize).width / 2 + size / 2;
      }).attr('y', function(d) {
        var rad;
        rad = _this.compute_radius(d.value, fsize);
        return size / 2 + rad.height / 4;
      });
      t0.selectAll('g.rect').select('rect').attr('width', size).attr('height', size);
      t1 = t0.transition().duration(step);
      t1.selectAll('g.rect').attr('transform', function() {
        var v, x;
        v = d3.select(this).attr('target_y') || y_level(1);
        x = d3.select(this).attr('x');
        d3.select(this).attr('target_y', null);
        d3.select(this).attr('y', v);
        return "translate(" + x + "," + v + ")";
      });
      return t1.each('end', function() {
        return _this.svg.selectAll('[exit]').remove();
      });
    };

    return VizArray;

  })();

}).call(this);

/*
//@ sourceMappingURL=exec.js.map
*/