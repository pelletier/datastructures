require 'guard/guard'


module ::Guard
  class Assets < ::Guard::Guard
    def start
      ::Guard::UI.info "Now monitoring assets"
      build
    end

    def build
      puts %x(grunt build && mkdir -p assets/ && cp -R _build/* assets/)
    end

    def run_all
      ::Guard::UI.info "Rebuilding all assets"
      build
    end

    def run_on_changes(path)
      ::Guard::UI.info "Asset #{path} changed"
      build
    end
  end

  class View < ::Guard::Guard
    def start
      ::Guard::UI.info "Nanoc server started"
      @io = IO.popen("nanoc view")
      $?.success?
    end

    def stop
      Process.kill("TERM", @io.pid)
    end
  end
end

interactor :off

guard 'nanoc' do
  watch('nanoc.yaml') # Change this to config.yaml if you use the old config file name
  watch('Rules')
  watch(%r{^(content|layouts|lib|assets)/.*$})
end

guard 'assets' do
  watch(%r{^src/.*$})
end

guard 'view'
