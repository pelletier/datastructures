@WORKER={} if @WORKER is undefined
WORKER=@WORKER

class @WORKER.Represented

    represent_as: (interface_name) ->
        WORKER.manager.register(this, interface_name)
        @notify()
        return this

    notify: () ->
            WORKER.manager.notify(this)

@WORKER={interfaces:{}} if @WORKER is undefined
WORKER=@WORKER


class Binding
    constructor: (@object, @id, @interface) ->


class @WORKER.WorkerDSManager

    constructor: () ->
        WORKER.interfaces = {} if WORKER['interfaces'] is undefined
        @interfaces = WORKER.interfaces
        @counter = 0
        @bindings = []

    register: (object, interface_name) ->
        @counter += 1
        @bindings.push(new Binding(object, @counter, interface_name))
        @send({
            id: @counter,
            kind: 'register',
            interface: interface_name
        })

    notify: (object) ->
        for binding in @bindings when binding.object is object
            @send({
                id: binding.id,
                kind: 'update',
                data: WORKER.interfaces[binding.interface].process(binding.object)
            })

    send: (data) ->
        WORKER.mediator.send('manager', data)

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

@WORKER={} if @WORKER is undefined
WORKER=@WORKER


class @WORKER.Mediator

    constructor: () ->
        self.addEventListener('message', @receive, false)

    receive: (event) ->
        data = JSON.parse(event.data)
        
        # switch over data.action
        switch data.action
            when "perform"
                WORKER.executor.run(data.lines)

    send: (type, data) ->
        self.postMessage(JSON.stringify({type: type, data: data}))

@DS={} if @DS is undefined
if @WORKER is undefined
    class Represented
        notify: () ->
    @WORKER = {Represented: Represented}

class @DS.Array extends @WORKER.Represented

    constructor: (init) ->
        @length = 0

        if init isnt undefined
            for val, index in init
                this[index] = val
            @length = init.length

        if @length isnt 0
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

@WORKER={} if @WORKER is undefined
@DS={} if @DS is undefined
DS = @DS
WORKER = @WORKER


class Executor
    run: (@code) ->
        context = {}
        for p of this
            context[p] = undefined
        context['console'] = @_console
        context['update'] = @_update
        context['_send'] = @_send
        context['DS'] = DS # custom datastructures
        (new Function("with(this) { #{@code.join('\n')} }")).call(context)
        @_send 'run', 'done'

    # XXX: wrote this to fix some closure shit. I've no idea why
    # _console: log: () -> @_send
    # does not find @_send
    _console: log: (msg) ->
        WORKER.mediator.send('exec', {kind: 'log', data: msg})

    _update: (i) -> @_send 'update', {line: i}

    _send: (kind, data) ->
        WORKER.mediator.send('exec', {kind: kind, data: data})

# Make sure this file is the last one in compiled JS file

if @WORKER is undefined
    self.postMessage(JSON.stringify({type:'fatal', data: 'bad worker.js file'}))
    self.close()


@WORKER.mediator = new @WORKER.Mediator()
@WORKER.executor = new Executor()
@WORKER.manager = new @WORKER.WorkerDSManager()

@WORKER.mediator.send('main', 'ready')
