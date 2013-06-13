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
        $('#representations svg').remove()

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
            "array_tree": VizTree,
            "array_array": VizArray
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
                            height = 400
                            width = 390
                            representations[data.data.id] = new visualizations[data.data.interface](speed, width, height)
                        when 'update'
                            console.log("updating #{data.data.id}")
                            states.push({repr_id: data.data.id, data: data.data.data})

class VizTree

    constructor: (@speed, @width, @height) ->
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

        @diagonal = d3.svg.diagonal()

    resize: (@width, @height) ->

    get_parent: (el) -> d3.select(d3.select(el).node().parentNode)

    null_diagonal: (d) ->
        o = {x: d.source.x, y: d.source.y}
        d3.svg.diagonal()({source: o, target: o})

    compute_radius: (d) =>
        return d.rad if d.rad isnt undefined
        @svg.append("svg:text").attr('class', 'tmp').text(d.name)
        bbox = @svg.select('text.tmp')[0][0].getBBox()
        rad = (Math.max(bbox.width, bbox.height) + 20) / 2
        @svg.select('text.tmp').remove()
        d.rad = rad
        d.bbox = bbox
        return rad

    draw: (data) ->
        if data is null
            @svg.selectAll('*').remove()
            return

        bound = this
        nodes = @tree.nodes(data)
        links = @tree.links(nodes)
        exited = false

        # Create entering nodes
        nodes_group = @svg.selectAll('g.node')
            .data(nodes)
            .enter()
            .append('svg:g')
                .attr('class', 'node')
                .attr('transform', (d) -> "translate(#{d.x}, #{d.y})")
        nodes_group.append('svg:circle')
            .attr('class', 'circle')
            .attr('r', 0)
        nodes_group.append('svg:text')
            .style('opacity', 0)

        @svg.selectAll('g.node')
            .data(nodes)
            .select('text')
            .text((d) ->
                that = d3.select(this)
                old = that.text()
                if old != d.name # != not !==
                    bound.get_parent(this).select('circle').classed('dirty', true)
                return d.name)

        # Remove exiting links
        @svg.selectAll('path.link')
            .data(links)
            .exit()
            .classed('remove', true)
            .classed('ready', false)
            .each(() -> exited = true)

        # Remove exiting nodes
        @svg.selectAll('g.node')
            .data(nodes)
            .exit()
            .classed('remove', true)
            .each(() -> exited = true)

        # Create entering links
        @svg.selectAll('path.link')
            .data(links)
            .enter()
            .insert('svg:path', 'g.node')
            .attr('class', 'link')
            .attr('d', @null_diagonal)

        # Remove exiting elements
        step = @speed * 2 # could be / 3
        max_step = (x) -> if x > step then step else x
        min_zero = (x) -> if x < 0 then 0 else x
        t0 = @svg
        if exited
            t0 = @svg.transition().duration(step)
            t0.selectAll('.link.remove')
                .attr('d', @null_diagonal)
            t0.selectAll('.node.remove')
                .style('opacity', 0)

        t1 = t0.transition().duration(step)
        t1.selectAll('.node')
            .attr('transform', (d) -> "translate(#{d.x}, #{d.y})")
        t1.selectAll('.node circle.dirty')
            .style('fill', '#049cdb')
        t1.selectAll('.link.ready')
            .attr('d', @diagonal)

        t2 = t1.transition().duration(step)
        t2.selectAll('.node circle')
            .attr('r', @compute_radius)
        t2.selectAll('.node text')
            .attr('x', (d) =>
                @compute_radius(d)
                return -d.bbox.width / 2)
            .attr('dy', (d) -> 5)
            .delay(max_step((if exited then 2*step else step) + 300)) # different delay depending on t0
            .duration(min_zero(step - 300))
            .style('opacity', 1)
        t2.selectAll('.link:not(.remove)')
            .attr('d', @diagonal)
            .each((d) -> d3.select(this).classed('ready', true))
        t2.selectAll('.node circle.dirty')
            .style('fill', 'white')
            .each((d) -> d3.select(this).classed('dirty', false))

        # remove elements fromt the DOM tree
        t2.each('end', () -> bound.svg.selectAll('.remove').remove())

class VizArray

    constructor: (@speed, @width, @height) ->
        @xspacing = 10
        @yspacing = 10
        @xmargin = 10
        @ymargin = 10
        @inode = 0
        @old_data = null

        @svg = d3.select("#representations").append('div').attr('class', 'viz array')
            .append("svg")
            .attr('width', @width)
            .attr('height', @height)
            .append('g').attr('transform', "translate(#{@xmargin},#{@ymargin})")

    resize: (@width, @height) ->

    compute_radius: (d, size) ->
        @svg.append("svg:text")
            .attr('class', 'tmp')
            .text(d)
            .style('font-size', "#{size}px")
        bbox = @svg.select('text.tmp')[0][0].getBBox()
        rad = (Math.max(bbox.width, bbox.height) + Math.max(@xspacing, @yspacing)*2) / 2
        @svg.select('text.tmp').remove()
        return bbox

    morph_data: (data, old_data) ->
        old_data = old_data or []
        if old_data.length is data.length
            for i in [0...data.length]
                old_data[i].value = data[i]
        else if old_data.length < data.length
            for i in [0...data.length]
                if i is old_data.length or data[i] isnt old_data[i].value
                    old_data.splice(i, 0, {
                        value: data[i],
                        inode: @inode++
                    })
                    break
        else
            for i in [0...old_data.length]
                if data[i] isnt old_data[i].value
                    old_data.splice(i, 1)
                    break

        for i in [0...old_data.length]
            old_data[i].index = i
        return old_data

    draw: (data) ->
        new_data = @morph_data(data, @old_data)
        @old_data = new_data
        data = new_data

        block_x = (@width - 2*@xmargin - (data.length - 1) * @xspacing) / data.length
        block_y = (@height - 2*@ymargin - 2 * @yspacing) / 3
        size = Math.min(block_x, block_y)
        fsize = Math.floor(size / 4)

        y_level = (i) => i * (@yspacing + size)
        x_level = (i) => i * (@xspacing + size)
        sel = (d) -> d.inode

        exited = false

        @svg.selectAll('g.rect')
            .data(data, sel)
            .exit()
            .attr('target_y', y_level(2))
            .attr('exit', true)
            .each(() -> exited = true)

        rectGroup = @svg.selectAll('g.rect')
            .data(data, sel)
            .enter()
            .append('svg:g')
                .attr('class', 'rect')
                .attr('y', y_level(0))
                .attr('x', x_level(0))
                .attr('target_y', y_level(1))
                .attr('target_x', (d,i) -> x_level(d.index))
        rectGroup.append('svg:rect')
            .attr('width', size)
            .attr('height', size)
        rectGroup.append('svg:text')
            .text((d) -> d.value)
            .style('font-size', fsize + 'px')
            .attr('x', (d) =>
                rad = @compute_radius(d.value, fsize)
                return -rad.width/2 + size / 2)
            .attr('y', (d) =>
                rad = @compute_radius(d.value, fsize)
                return size / 2 + rad.height / 4)

        step = @speed * 2

        t0 = @svg.transition().duration(step)
        if exited
            t0.selectAll('g.rect[exit]')
                .attr('transform', (d, i) ->
                    v = d3.select(this).attr('target_y')
                    x = d3.select(this).attr('x')
                    d3.select(this).attr('y', v)
                    return "translate(#{x}, #{v})")
                .style('opacity', (d) -> d3.select(this).attr('exit') ? 0 : 1)
            t0 = t0.transition().duration(step)
 
        t0.selectAll('g.rect')
            .attr('transform', (d, i) ->
                v = d3.select(this).attr('target_x') or x_level(d.index)
                y = d3.select(this).attr('y')
                d3.select(this).attr('target_x', null)
                d3.select(this).attr('x', v)
                return "translate(#{v},#{y})")
            .select('text')
                .text((d) -> d.value)
                .style('font-size', fsize + 'px')
                .attr('x', (d) => -@compute_radius(d.value, fsize).width/2 + size / 2)
                .attr('y', (d) =>
                    rad = @compute_radius(d.value, fsize)
                    return size / 2 + rad.height / 4) #XXX
 
        t0.selectAll('g.rect')
            .select('rect')
            .attr('width', size)
            .attr('height', size)

        t1 = t0.transition().duration(step)
        t1.selectAll('g.rect')
            .attr('transform', () ->
                v = d3.select(this).attr('target_y') or y_level(1)
                x = d3.select(this).attr('x')
                d3.select(this).attr('target_y', null)
                d3.select(this).attr('y', v)
                return "translate(#{x},#{v})")
        t1.each('end', () => @svg.selectAll('[exit]').remove())
