class VizTree

    constructor: () ->
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

    draw: (data) ->
        @nodes = @tree.nodes(data)
        @links = @tree.links(@nodes)

        # draw edges
        link = d3.svg.diagonal()
            .projection (d) -> [d.x, d.y]
        @svg.selectAll('path.link')
            .data(@links)
            .enter()
            .append('svg:path')
            .attr('class', 'link')
            .attr('d', link)

        # draw nodes
        nodeGroup = @svg.selectAll('g.node')
            .data(@nodes)
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
        @svg.append("svg:text").text(d.name)
        bbox = @svg.select('text')[0][0].getBBox()
        rad = (Math.max(bbox.width, bbox.height) + 20) / 2
        @svg.select('text').remove()
        d.rad = rad
        d.bbox = bbox
        return rad
