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

        t0 = @svg.transition().duration(1000)
        if exited
            t0.selectAll('g.rect[exit]')
                .attr('transform', (d, i) ->
                    v = d3.select(this).attr('target_y')
                    x = d3.select(this).attr('x')
                    d3.select(this).attr('y', v)
                    return "translate(#{x}, #{v})")
                .style('opacity', (d) -> d3.select(this).attr('exit') ? 0 : 1)
            t0 = t0.transition().duration(1000)
 
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
            .attr('height', size);
        
        t1 = t0.transition().duration(1000)
        t1.selectAll('g.rect')
            .attr('transform', () ->
                v = d3.select(this).attr('target_y') or y_level(1)
                x = d3.select(this).attr('x')
                d3.select(this).attr('target_y', null)
                d3.select(this).attr('y', v)
                return "translate(#{x},#{v})")
        t1.each('end', () => @svg.selectAll('[exit]').remove())
