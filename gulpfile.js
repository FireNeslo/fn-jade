var gulp       = require('gulp'),
    budo       = require('budo'),
    watch      = require('gulp-watch'),
    rollup     = require('gulp-rollup'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('build', function(){
  return gulp.src('src/index.js', {read: false})
    .pipe(rollup(require('./rollup.config')))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest('.'));
});

gulp.task('runtime', function(){
  return gulp.src('src/runtime.js', {read: false})
    .pipe(rollup(require('./rollup.config')))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest('.'));
});

gulp.task('watch', ['build'], function () {
  watch('src/**/*.js', function() {
    gulp.start(['build'])
  })
})

gulp.task('serve', ['watch'], function() {
  budo('index.js', {
    live: true,
    browserify: {
      noParse: [ require.resolve("babylon/index.js") ]
    }
  })
})

gulp.task('defa ult', ['watch'])
