@WORKER={} if @WORKER is undefined
WORKER=@WORKER

class @WORKER.Represented

    represent_as: (interfaces_names...) ->
        for interface_name in interfaces_names
            WORKER.manager.register(this, interface_name)
            @notify()
        return this

    notify: () ->
            WORKER.manager.notify(this)
