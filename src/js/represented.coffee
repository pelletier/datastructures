@WORKER={} if @WORKER is undefined
WORKER=@WORKER

class @WORKER.Represented

    represent_as: (interface_name) ->
        @_manager = WORKER.manager
        WORKER.manager.register(this, interface_name)

    notify: () ->
        if this['_manager'] is undefined
            console.log("You need to register that structure before.")
        else
            @_manager.notify(this)
