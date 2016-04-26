var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');

var simpleJsLint = require('gulp-jslint-simple'),
  runSequence = require('run-sequence'),
  fs = require('fs'),
  path = require('path');

var paths = {
  sass: ['./scss/**/*.scss'],
  all_js: 'www/js/**/*.js',
  views_js: 'www/views/**/*.js',
  app_js: 'www/js/app.js',
  not_compiled_js: '!www/js/-compiled/*.js'
};

gulp.task('default', ['watch']);

gulp.task('jslint', function () {
  console.log('\n\nlinting javascript...\n\n');
  return gulp.src([
    paths.all_js,
    paths.views_js,
    paths.app_js,
    paths.not_compiled_js
  ])
    .pipe(simpleJsLint.run({
      predef: ['ionic', 'angular', 'console', 'cordova', 'Firebase'],
      todo: true,
      browser: true,
      plusplus: true,
      indent: 2
    }))
    .pipe(simpleJsLint.report({
      reporter: function (result) {
        var i = 0,
          filename = '';
        for (i = 0; i < result.length; i++) {
          filename = result[i].file.split('www/')[1];
          console.log(gutil.colors.red(filename + '(' + result[i].error.line + ',' + result[i].error.character + ')' + ': ' + result[i].error.reason));
        }
      }
    }));
  // done();
});

gulp.task('compile-js', function () {
  return gulp.src([
    paths.all_js,
    paths.views_js,
    paths.app_js,
    paths.not_compiled_js
  ])
    .pipe(concat('all.js'))
    .pipe(gulp.dest('www/js/-compiled/'));
});

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', ['jslint', 'sass', 'compile-js'], function () {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch([paths.all_js, paths.views_js, paths.app_js, paths.not_compiled_js], ['jslint']);
  gulp.watch([paths.all_js, paths.views_js, paths.app_js, paths.not_compiled_js], ['compile-js']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
