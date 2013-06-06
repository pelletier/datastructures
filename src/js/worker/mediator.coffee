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
