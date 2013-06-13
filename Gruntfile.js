module.exports = function(grunt) {
    var assets = "content/assets";
    var build = "_build";
    var tmp = "/tmp/datastructures";
    var tests = "_tests"

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-coffee');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'components/bootstrap/', src: ['less/*.less'], dest: tmp+'/bootstrap', filter: 'isFile'}, // includes files in path
                    {expand: true, cwd: 'components/bootstrap/', src: ['img/*'], dest: build, filter: 'isFile'}, // includes files in path
                    {expand: true, cwd: 'components/bootstrap/js/', src: ['*.js'], dest: build+'/js/bootstrap/', filter: 'isFile'}, // includes files in path
                    {expand: true, cwd: 'components/jquery/', src: ['jquery.js'], dest: build+'/js/', filter: 'isFile'},
                    {expand: true, cwd: 'components/d3/', src: ['d3.js'], dest: build+'/js/', filter: 'isFile'},
                    {expand: true, cwd: 'components/angular/', src: ['angular.js'], dest: build+'/js/', filter: 'isFile'},
                    {expand: true, cwd: 'components/font-awesome/build/assets/font-awesome', src: ['css/font-awesome.css',  'font/*'], dest: build, filter: 'isFile'}, // includes files in path
                    {expand: true, cwd: 'components/ace-js-xcode/lib', src: ['*'], dest: build+'/js/', filter: 'isFile'},
                    {expand: true, cwd: 'components/ace/src-noconflict/', src: ['ace.js', 'theme-xcode.js', 'mode-javascript.js'], dest: build+'/js/', filter: 'isFile'}
                ]
            }
        },
        //concat: {
            //options: {
                //separator: ';'
            //},
            //dist: {
                //files: {
                    //'_build/js/bootstrap.js': [tmp+'/js/bootstrap/*.js']
                //}
            //}
        //},
        less: {
            bootstrap: {
                options: {
                    paths: [tmp+'/bootstrap/less/']
                },
                files: {
                    '_build/css/bootstrap.css': tmp+'/bootstrap/less/bootstrap.less',
                    '_build/css/site.css': 'src/css/site.less',
                    '_build/css/viz.css': 'src/css/viz.less'
                }
            }
        },
        coffee: {
            compileWithMaps: {
                options: {
                    sourceMap: true
                },
                files: {
                    '_build/js/worker.js': [
                        'src/js/worker/represented.coffee',
                        'src/js/worker/WorkerDSManager.coffee',
                        'src/js/worker/arraytree.coffee',
                        'src/js/worker/identity.coffee',
                        'src/js/worker/mediator.coffee',
                        'src/js/worker/array.coffee',
                        'src/js/worker/executor.coffee',
                        'src/js/worker/worker.coffee'
                    ],
                    '_build/js/exec.js': [
                        'src/js/exec_js/exec_js.coffee',
                        'src/js/exec_js/viz_tree.coffee',
                        'src/js/exec_js/viz_array.coffee'
                    ],

                    '_tests/array.js': 'src/js/worker/array.coffee'
                }
            }
        },
        simplemocha: {
            options: {
                "compilers": "coffee:coffee-script",
                "reporter": "dot"
            },
            all: ['tests/*.coffee']
        }
    });

    grunt.registerTask('build', ['copy', 'less', 'coffee']);
    grunt.registerTask('test', ['build', 'simplemocha']);
};
