module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		uglify: {
			main : {
				files: {
					'dist/min/view.min.js': ['dist/view.js']
				}
			}
		},

		copy : {
			main : {
				files : [
					{ cwd:'src/', src:'**', dest:'dist/', expand:true },
					{ cwd:'src/', src:'**', dest:'demo/js/lib/', expand:true }
				]
			},

			bower : {
				expand : true,
				flatten : true,
				cwd : 'bower_components',
				src : ['*/*.js'],
				dest : 'demo/js/lib/'
			}
		},

		jshint : {
			options : {
				browser : true
			},
			main : [
				'src/**/*.js',
				'!src/test/**/*.js',
				'!src/demo/**/*.js'
			]
		},

		jsdoc : {
			main : {
				src: [
					'src/*.js',
					'README.md'
				],
				jsdoc : './node_modules/.bin/jsdoc',
				dest : 'docs',
				options : {
					configure : 'jsdoc.json'
				}
			}
		},

		watch : {
			options : {
				interrupt : true
			},
			src : {
				files : [
					'src/**/*.js',
					'Gruntfile.js',
					'README.md',
					'jsdoc-template/**/*'
				],
				tasks : ['default']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', [
		'jshint:main',
		'copy:bower',
		'copy:main',
		'uglify:main',
		'jsdoc:main'
	]);

	grunt.registerTask('build-watch', [
		'default',
		'watch'
	]);

};
