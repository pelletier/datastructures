@WORKER={} if @WORKER is undefined
@WORKER.interfaces = {} if @WORKER.interfaces is undefined

class Identity
    process: (data) -> data


@WORKER.interfaces['identity'] = new Identity()
