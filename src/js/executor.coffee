@WORKER={} if @WORKER is undefined
@DS={} if @DS is undefined
DS = @DS
WORKER = @WORKER


class @WORKER.Executor

    constructor: (@code) ->

    run: () ->
        context = {}
        for p of this
            context[p] = undefined
        context['console'] = @_console
        context['update'] = @_update
        context['DS'] = DS # custom datastructures
        (new Function("with(this) { #{@code.join('\n')} }")).call(context)
        @send 'run', 'done'

    _console: () -> @send 'log', msg

    _update: (i) -> @send 'update', {line: i}

    send: (kind, data) ->
        WORKER.mediator.send('exec', {kind: kind, data: data})
