@WORKER={} if @WORKER is undefined
@WORKER.interfaces = {} if @WORKER.interfaces is undefined


class ArrayTree
    process: (@array) ->
        @to_array(0)

    to_array: (i) ->
        return null if i >= @array.length
        root = {
            name: @array[i].toString()
            children: []
        }
        left_child = @to_array(2*i + 1)
        right_child = @to_array(2*i + 2)
        root.children.push(left_child) if left_child
        root.children.push(right_child) if right_child
        return root



@WORKER.interfaces['array_tree'] = new ArrayTree()
