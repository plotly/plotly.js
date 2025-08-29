'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner:
        '/*\n\n' +
        '<%= pkg.name %> - <%= pkg.version %> - <%= pkg.summary %>\n' +
        '(c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> / <%= pkg.author.url %>\n\n' +
        'Provided under the <%= pkg.license.type %> License: <%= pkg.license.url %>\n' +
        'Commercial use requires attribution.\n\n' +
        '*/\n',
    // Task configuration.
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: ['holder.js']
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: 'holder.js',
        dest: 'holder.min.js'
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');


  // Default task.
  grunt.registerTask('default', ['jshint', 'uglify']);
};
