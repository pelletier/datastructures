module.exports = function(grunt) {
    var assets = "content/assets";
    var build = "_build";
    var tmp = "/tmp/datastructures";

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
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
                    {expand: true, cwd: 'components/bootstrap/js/', src: ['*.js'], dest: tmp+'/js/bootstrap/', filter: 'isFile'}, // includes files in path
                    {expand: true, cwd: 'components/jquery/', src: ['jquery.js'], dest: build+'/js/', filter: 'isFile'},
                    {expand: true, cwd: 'components/angular/', src: ['angular.js'], dest: build+'/js/', filter: 'isFile'},
                    {expand: true, cwd: 'components/font-awesome/build/assets/font-awesome', src: ['css/font-awesome.css',  'font/*'], dest: build, filter: 'isFile'}, // includes files in path
                    {expand: true, cwd: 'components/ace-js-xcode/lib', src: ['*'], dest: build+'/js/', filter: 'isFile'},
                    {expand: true, cwd: 'components/ace/build/src', src: ['ace.js'], dest: build+'/js/', filter: 'isFile'}
                ]
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                files: {
                    '_build/js/bootstrap.js': [tmp+'/js/bootstrap/*.js']
                }
            }
        },
        less: {
            bootstrap: {
                options: {
                    paths: [tmp+'/bootstrap/less/']
                },
                files: {
                    '_build/css/bootstrap.css': tmp+'/bootstrap/less/bootstrap.less',
                    '_build/css/site.css': 'src/css/site.less'
                }
            }
        },
        coffee: {
            compileWithMaps: {
                options: {
                    sourceMap: true
                },
                files: {
                    '_build/js/workers.js': 'src/js/worker.coffee',
                    '_build/js/exec.js': ['src/js/array.coffee', 'src/js/exec_js.coffee']
                }
            }
        }
    });

    grunt.registerTask('build', ['copy', 'concat', 'less', 'coffee']);
};

