editor = null
worker = null
running = false

log = (msg) ->
    output = $("#output")
    output.val(output.val() + msg + '\n')

load_code = (name) ->
    $.ajax(name, {dataType: "text"}).done (msg) =>
        editor.setValue(msg)
        editor.gotoLine(1)

$(document).ready () =>
    if typeof(Worker) is undefined
        alert("Your browser does not support web workers.\nGo home, dinausaur!")
        return

    editor = ace.edit('code')
    editor.getSession().setUseWorker(false)
    editor.setTheme('ace/theme/xcode')
    editor.getSession().setMode('ace/mode/javascript')

    load_code('heap/heap.js')

    $("#start").click () =>
        return false if running

        editor.getSession().clearAnnotations()
        $('#output').val('')

        lines = editor.getSession().getDocument().getAllLines()[..]
        console.log(lines)

        # check if there is just one instruction per line
        for line, index in lines
            line = $.trim(line)
            if not line.match(/^((.*(;|{|}))||\/\/.*)$/)
                ln = index + 1
                log("Line " + ln + " does not ends with any of [';', '{', '}']. Abort.")
                log("-> " + line)
                editor.getSession().setAnnotations([{
                  row: ln - 1,
                  column: line.length,
                  text: "Bad line",
                  type: "error" # also warning and information
                }])
                return # abort on the first error

        running_lines = []
        for line, index in lines
            running_lines.push(line)
            tline = $.trim(line)
            # } else {
            if not (tline.match(/^}?$/) or   # don't output after blank and } lines
                    tline.match(/^\/\/.*$/)) # don't output after comment
                running_lines.push("update(#{index});")

        console.log(running_lines.join('\n'))

        speed = parseFloat($("#speed option:selected").val())

        worker = new Worker('worker.js')
        worker.onmessage = (event) =>
            data = JSON.parse(event.data)
            console.log(data)

            switch data.action
                when "ready"
                    payload = {
                        'action': 'perform',
                        'lines': running_lines,
                        'speed': speed
                    }
                    worker.postMessage(JSON.stringify(payload))
                    $("#start").html('<i class="icon-spinner icon-spin icon-large"></i> Running...')
                    running = true
                    editor.setReadOnly(true)
                    $("#speed").attr('disabled', true)
                when "done"
                    console.log("computation completed")
                    $("#start").html('<i class="icon-play"></i> Run</a>')
                    running = false
                    editor.setReadOnly(false)
                    $("#speed").removeAttr('disabled')
                when "console"
                    console.log("console: #{data.data}")
                    log(data.data)
                when "line"
                    console.log("move to line: #{data.data}")
                    editor.setHighlightActiveLine(true)
                    editor.gotoLine(data.data + 1, 0, false)
                else
                    console.log("unhandled message")
