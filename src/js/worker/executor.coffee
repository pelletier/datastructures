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
