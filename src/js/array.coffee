@DS={} if @DS is undefined

class @DS.Array extends @WORKER.Represented

    constructor: (init) ->
        @length = 0

        if init isnt undefined
            for val, index in init
                this[index] = val
            @length = init.length
        @notify()

    keys: () -> [0...@length]

    push: (value) ->
        this[@length] = value
        @length += 1
        @notify()

    drop: (index) ->
        return if not @valid_bounds(index)
        if index isnt @length - 1
            for i in [(index + 1)...@length]
                this[i - 1] = this[i]
        this[@length - 1] = undefined
        @length -= 1
        @notify()

    drop_last: () -> @drop(@length - 1)

    swap: (i, j) ->
        return if not @valid_bounds(i, j)
        [this[i], this[j]] = [this[j], this[i]]
        @notify()

    valid_bounds: (indexes...) ->
        Math.min(indexes...) >= 0 and Math.max(indexes...) < @length
