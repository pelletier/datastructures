@DS={} if @DS is undefined
class @DS.Array

    constructor: (init) ->
        @length = 0

        if init isnt undefined
            for val, index in init
                this[index] = val
            @length = init.length

    keys: () -> [0...@length]

    push: (value) ->
        this[@length] = value
        @length += 1

    drop: (index) ->
        return if not @valid_bounds(index)
        if index isnt @length - 1
            for i in [(index + 1)...@length]
                this[i - 1] = this[i]
        this[@length - 1] = undefined
        @length -= 1

    drop_last: () -> @drop(@length - 1)

    swap: (i, j) ->
        return if not @valid_bounds(i, j)
        [this[i], this[j]] = [this[j], this[i]]

    valid_bounds: (indexes...) ->
        Math.min(indexes...) >= 0 and Math.max(indexes...) < @length

speed = 0

postData = (data) ->
    self.postMessage(JSON.stringify(data))

ready_msg =      () -> {action: 'ready'}
done_msg =       () -> {action: 'done'}
console_msg = (msg) -> {action: 'console', data: msg}
line_msg =      (i) -> {action: 'line',    data: i}

sleep = (amount) ->
    start = new Date().getTime()
    while true
        break if (new Date().getTime() - start) > amount

console = { log: (msg) -> postData(console_msg(msg)) }

update = (i) ->
    postData(line_msg(i))
    sleep(speed)


run = (rlines) ->
    context = {}
    for p of this
        context[p] = undefined
    context['console'] = console
    context['update'] = update
    context['DS'] = this.DS # custom datastructures
    (new Function("with(this) { #{rlines.join('\n')} }")).call(context)
    postData(done_msg())

# wait for input

self.addEventListener 'message', (event) =>
    data = JSON.parse(event.data)
    if data.action is 'perform'
        speed = data.speed * 1000
        run(data.lines)
    else
        console.log("unknown message: #{data}")
, false


postData(ready_msg())
