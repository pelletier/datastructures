
@WORKER={} if @WORKER is undefined
@WORKER.interfaces = {} if @WORKER.interfaces is undefined

class ArrayArray
    process: (array) -> array


@WORKER.interfaces['array_array'] = new ArrayArray()
