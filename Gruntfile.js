/*global module:false*/
module.exports = function(grunt) {

  var packagejson = grunt.file.readJSON('package.json');
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: packagejson,
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - last build: <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
    // Task configuration.
    concat: {
      options: {
        banner: ';(function(global){ ',
        footer: '\n\n})(this || window);'
      },
      dist: {
        src: packagejson.buildFiles,
        dest: 'build/heatmap.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        mangle: true,
        compress: false, //compress must be false, otherwise behaviour change!!!!!
        beautify: false
      },
      dist: {
        src: 'build/heatmap.js',
        dest: 'build/heatmap.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      dist: {
        files: packagejson.buildFiles,
        tasks: ['concat', 'uglify']
      }
    },
    docco: {
      debug: {
        src: ['src/*.js'],
        options: {
          output: 'docs/'
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-docco');

  // Default task.
  grunt.registerTask('default', ['concat', 'jshint', 'uglify', 'watch']);
  grunt.registerTask('docs', ['docco']);

};
