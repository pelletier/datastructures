# Datastructures

## Dependencies

* `npm` (+ any JS runtime)

## Build

1. `npm install` to install `bower`
2. `bower install` to install the components
3. `make` build the website; the result is in `/output/`


## Develop

`make watch` will start [Guard](http://guardgem.org/), which in turn starts an
HTTP server (`nanoc view`) and automatically rebuild the pages when a source
file is modified.


## Organisation

### In repository
* `/content/` contains the static site
* `/content/algorithms/` contains the algorithms
* `/src/` contains the site-specific JS and LESS files

### Created by build

* `/_build/` temporary folder for assets building
* `/content/assets/` built assez ready to use by nanoc
* `/output/` site fully built, output of nanoc
* `/_tests/` used during tests


## Pipeline

1. `[npm] -> [bower + grunt]`
2. `[bower] -> [sources of 3rd-party libs]`
3. `[grunt] -> [compile + optimize 3rd-party and site's assets]`
4. `[nanoc] -> [compile static pages and output final site]`
