var gulp = require('gulp');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var striplog = require('gulp-strip-debug');
var minifycss = require('gulp-minify-css');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var notify = require("gulp-notify");
var connect = require('gulp-connect');
var inline = require('gulp-inline');
var autoprefixer = require('gulp-autoprefixer');

//js files
gulp.task('scripts', function() {
  var js_src = ['src/js/*.js', 'node_modules/materialize-css/dist/js/materialize.js']; 
  var js_dest = 'dist/js';
  // pipe the js through concat, console log stripping, uglification and then store
  return gulp.src(js_src)
      .pipe(concat('app.min.js')) // concat all files in the src
      // .pipe(striplog())
      // .pipe(uglify())
      .pipe(gulp.dest(js_dest)) // save the file
      .on('error', gutil.log); 
});

gulp.task('inline', function() {
  return;
  gulp.src('src/html/index.html')
  .pipe(inline({
    base: 'dist/',
    disabledTypes: ['svg', 'img', 'png'],
    ignore: ['dist/index.html'],
    js: function() {
      return uglify({
          mangle: false
      });
    }
  }))
  .pipe(gulp.dest('dist/'));
})


gulp.task('css', function() {  
  return gulp.src(['node_modules/materialize-css/dist/css/materialize.css', 'src/scss/*.scss']) 
      .pipe(sass({style: 'compressed', errLogToConsole: true}))  // Compile sass
      .pipe(concat('app.min.css'))                               // Concat all css
      .pipe(minifycss())                                         // Minify the CSS
      .pipe(gulp.dest('dist/css'))                      // Set the destination to assets/css
});

// Clean all builds
gulp.task('clean', function() {
  return gulp.src(['dist/css', 'dist/js'], {read: false})
    .pipe(clean());
});

// web server
gulp.task('webserver', function() {
  connect.server();
});

// Default task - clean the build dir
// Then rebuild the js and css files

gulp.task('watch', function(){
    connect.server();
  gulp.watch(['src/scss/*.scss'], gulp.series('css')); // Watch and run sass on changes
  gulp.watch('src/js/*.js', gulp.series('scripts')); // Watch and run javascripts on changes
  gulp.src('assets/*')
    .pipe(notify('An asset has changed'));
});

gulp.task('default', gulp.series('css', 'scripts', 'watch'));