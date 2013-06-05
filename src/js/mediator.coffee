@WORKER={} if @WORKER is undefined

class @WORKER.Mediator

    constructor: () ->
        self.addEventListener('message', receive, false)

    receive: (event) ->
        data = JSON.parse(event.data)
        
        # switch over data.action

    send: (type, data) ->
        self.postMessage(JSON.stringify({type: type, data: data}))
