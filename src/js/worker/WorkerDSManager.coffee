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
