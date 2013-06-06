@WORKER={} if @WORKER is undefined
WORKER=@WORKER

class @WORKER.Represented

    represent_as: (interface_name) ->
        WORKER.manager.register(this, interface_name)
        @notify()
        return this

    notify: () ->
            WORKER.manager.notify(this)
