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
