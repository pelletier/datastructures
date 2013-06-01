function postData(data) {
    self.postMessage(JSON.stringify(data));
}

function ready_msg()      { return { 'action': 'ready'                }; }
function done_msg()       { return { 'action': 'done'                 }; }
function console_msg(msg) { return { 'action': 'console', 'data': msg }; }
function line_msg(i)      { return { 'action': 'line',    'data': i   }; }

function sleep(amount) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; ++i) {
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
    sleep(1000);
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
    run(event.data.split('\n'));
}, false);


postData(ready_msg());
