module Helpers
  module Algorithms
    def algorithms
      blk = lambda {@items.select {|item| item[:kind] == :algorithm}}
      if @items.frozen?
        @algorithms_items = blk.call
      else
        blk.call
      end
    end

    def algorithms_count
      algorithms.size
    end
  end
end
