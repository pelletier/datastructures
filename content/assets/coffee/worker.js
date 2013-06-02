var speed = 0;

function postData(data) {
    self.postMessage(JSON.stringify(data));
}

function ready_msg()      { return { 'action': 'ready'                }; }
function done_msg()       { return { 'action': 'done'                 }; }
function console_msg(msg) { return { 'action': 'console', 'data': msg }; }
function line_msg(i)      { return { 'action': 'line',    'data': i   }; }

function sleep(amount) {
    var start = new Date().getTime();
    while (true) {
        if ((new Date().getTime() - start) > amount) {
            break;
        }
    }
}

var console = {
    log: function(msg) {
        postData(console_msg(msg));
    }
};

function update(i) {
    postData(line_msg(i));
    sleep(speed);
}


function run(rlines) {
    var context = {};
    for (p in this)
        context[p] = undefined;
    context['console'] = console;
    context['update'] = update;
    (new Function( "with(this) { " + rlines.join('\n')+ "}")).call(context);
    postData(done_msg());
}

// wait for input

self.addEventListener('message', function(event) {
    var data = JSON.parse(event.data);
    if (data.action === 'perform') {
        speed = data.speed * 1000;
        run(data.lines);
    }
    else {
        console.log("unknown message: " + data);
    }
}, false);


postData(ready_msg());
