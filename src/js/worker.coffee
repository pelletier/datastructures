# Make sure this file is the last one in compiled JS file

if @WORKER is undefined
    self.postMessage(JSON.stringify({type:'fatal', data: 'bad worker.js file'}))
    self.close()


@WORKER.mediator = new @WORKER.Mediator()
@WORKER.manager = new @WORKER.WorkerDSManager()

@WORKER.mediator.send('main', 'ready')
