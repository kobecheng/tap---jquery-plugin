module.exports = function(grunt) {

  grunt.initConfig({
    qunit: {
      all: {
        options: {
          urls: ["http://localhost:3000/assets/test/index.html"]
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 3000,
          base: "../"
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-qunit");
  grunt.loadNpmTasks("grunt-contrib-connect");

  grunt.registerTask("test", ["connect", "qunit"]);

};
