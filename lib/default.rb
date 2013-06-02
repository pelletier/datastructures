# All files in the 'lib' directory will be loaded
# before nanoc starts compiling.

include Nanoc::Helpers::Rendering
include Nanoc::Helpers::LinkTo
include Helpers::Algorithms

$render_time = Time.now
