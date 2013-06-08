editor = null
representations = null
worker = null
running = false

log = (msg) ->
    output = $("#output")
    output.val(output.val() + msg + '\n')

load_code = (name) ->
    $.ajax(name, {dataType: "text"}).done (msg) =>
        editor.setValue(msg)
        editor.gotoLine(1)

# http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values
get_parameter = (name) ->
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]")
    regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
    results = regex.exec(location.search)
    return decodeURIComponent(results[1].replace(/\+/g, " "))

$(document).ready () =>
    console.log('ready')
    if typeof(Worker) is undefined
        alert("Your browser does not support web workers.\nGo home, dinausaur!")
        return

    editor = ace.edit('code')
    editor.getSession().setUseWorker(false)
    editor.setTheme('ace/theme/xcode')
    editor.getSession().setMode('ace/mode/javascript')

    load_code("../static/js/algorithms/#{get_parameter('file')}")

    $("#start").click () =>
        return false if running

        editor.getSession().clearAnnotations()
        $('#output').val('')

        lines = editor.getSession().getDocument().getAllLines()[..]
        console.log(lines)

        # check if there is just one instruction per line
        for line, index in lines
            line = $.trim(line)
            if not line.match(/^((.*(;|{|}))||\/\/.*)$/)
                ln = index + 1
                log("Line " + ln + " does not ends with any of [';', '{', '}']. Abort.")
                log("-> " + line)
                editor.getSession().setAnnotations([{
                  row: ln - 1,
                  column: line.length,
                  text: "Bad line",
                  type: "error" # also warning and information
                }])
                return # abort on the first error

        running_lines = []
        for line, index in lines
            running_lines.push(line)
            tline = $.trim(line)
            # } else {
            if not (tline.match(/^}?$/) or   # don't output after blank and } lines
                    tline.match(/^\/\/.*$/)) # don't output after comment
                running_lines.push("update(#{index});")

        console.log(running_lines.join('\n'))

        speed = parseFloat($("#speed option:selected").val()) * 1000

        states = []
        timer = null

        representations = {}
        visualizations = {
            "array_tree": VizTree
        }

        update_func = () ->
            while states.length > 0  and states[0]['line'] is undefined
                state = states.shift()
                if state['log'] isnt undefined
                    log(state.log)
                else if state['repr_id'] isnt undefined
                    representations[state.repr_id].draw(state.data)
                else if state['exec'] isnt undefined
                    console.log("computation completed")
                    $("#start").html('<i class="icon-play"></i> Run</a>')
                    running = false
                    editor.setReadOnly(false)
                    $("#speed").removeAttr('disabled')
            if states.length > 0
                state = states.shift()
                editor.setHighlightActiveLine(true)
                editor.gotoLine(state.line + 1, 0, false)
                setTimeout(update_func, speed)
            else if running
                setTimeout(update_func, speed)

        worker = new Worker('../static/js/worker.js')
        worker.onmessage = (event) =>
            data = JSON.parse(event.data)
            console.log(data)

            switch data.type
                when 'exec'
                    switch data.data.kind
                        when 'log'
                            console.log("console: #{data.data.data}")
                            states.push({log: data.data.data})
                        when 'update'
                            console.log("move to line: #{data.data.data.line}")
                            states.push({line: data.data.data.line})
                        when "run"
                            if data.data.data is 'done'
                                states.push({exec: 'done'})
                when 'main'
                    switch data.data
                        when 'ready'
                            payload = {
                                'action': 'perform',
                                'lines': running_lines
                            }
                            worker.postMessage(JSON.stringify(payload))
                            $("#start").html('<i class="icon-spinner icon-spin icon-large"></i> Running...')
                            running = true
                            editor.setReadOnly(true)
                            $("#speed").attr('disabled', true)
                            update_func()
                when 'manager'
                    console.log(data)
                    switch data.data.kind
                        when 'register'
                            console.log("registered #{data.data.id}")
                            representations[data.data.id] = new visualizations[data.data.interface](speed)
                        when 'update'
                            console.log("updating #{data.data.id}")
                            states.push({repr_id: data.data.id, data: data.data.data})

class VizTree

    constructor: (@speed) ->
        @width = 400
        @height = 400
        @svg = d3.select("#representations").append('div').attr('class', 'viz graph')
            .append("svg")
            .attr('width', @width)
            .attr('height', @height)
            .append('g').attr('transform', "translate(50,50)")

        @tree = d3.layout.tree()
            .size([@width-100, @height-100])
            .children((d) -> if d.children.length is 0 then null else d.children)
            .separation((a, b) =>
                @compute_radius(a)
                @compute_radius(b)
                return a.rad + b.rad + 10) # at least 10px between nodes

    get_parent: (el) -> d3.select(d3.select(el).node().parentNode)

    draw: (data) ->
        bound = this
        nodes = @tree.nodes(data)
        links = @tree.links(nodes)

        # draw edges
        diag = d3.svg.diagonal().projection((d) -> [d.x, d.y])
        @svg.selectAll('path.link')
            .data(links)
            .enter()
            .append('svg:path')
            .attr('class', 'link')
            .attr('d', diag)

        @svg.selectAll('g.node')
            .data(nodes)
            .select('text')
            .transition()
            .text((d) ->
                old = d3.select(this).text()
                if old isnt d.name
                    bound.get_parent(this).select('circle').classed('dirty', true)
                return d.name)

        @svg.selectAll('g.node')
            .data(nodes)
            .select('circle.dirty')
            .classed('dirty', false)
            .transition()
            .duration(@speed/2)
            .style('fill', '#049cdb')
            .transition()
            .duration(@speed/2)
            .style('fill', 'white')


        # draw nodes
        nodeGroup = @svg.selectAll('g.node')
            .data(nodes)
            .enter()
            .append('svg:g')
            .attr('class', 'node')
            .attr('transform', (d) -> "translate(#{d.x}, #{d.y})")

        nodeGroup.append("svg:circle")
            .attr("class", "node-dot")
            .attr('r', @compute_radius)

        # draw text
        nodeGroup.append("svg:text")
            .attr('x', (d) =>
                  @compute_radius(d)
                  console.log(d.rad)
                  return -d.bbox.width / 2)
            .attr('dy', (d) -> 5)
            .text((d) -> d.name)

    compute_radius: (d) =>
        return d.rad if d.rad isnt undefined
        @svg.append("svg:text").attr('class', 'tmp').text(d.name)
        bbox = @svg.select('text.tmp')[0][0].getBBox()
        rad = (Math.max(bbox.width, bbox.height) + 20) / 2
        @svg.select('text.tmp').remove()
        d.rad = rad
        d.bbox = bbox
        return rad
