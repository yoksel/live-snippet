var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var ghPages = require('gulp-gh-pages');
var colors = require('colors/safe');
var copy = require('gulp-copy');
var del = require('del');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var gulpSequence = require('gulp-sequence')

// CLEAN BUILD
gulp.task('clean', function(){
  del(['build/*']).then(paths => {
    console.log('⬤  Deleted files and folders:\n', paths.join('\n'));
  });
});

// CREATE INDEX PAGE FILE
gulp.task('make-index', function(){
  console.log(colors.yellow('⬤  Make index page... ⬤'));

  return gulp.src(['index-src.html'])
    .pipe(replace('<!-- content -->', '<a href="demo/dancing-shadows.html">dancing-shadows</a>'))
    .pipe(rename('index.html'))
    .pipe(gulp.dest('build/'));
});

// CLEAN BUILD & COPY FILES TO IT
gulp.task('copy', function() {
  console.log(colors.magenta('⬤  Copy files to build... ⬤'));

  return gulp.src(['assets/**/*','demo/**/*'])
    .pipe(copy('build/'));
});

// WATCH HTML, PREPROCESS AND RELOAD
gulp.task('serve', function() {
  browserSync({
    server: {
      baseDir: '.'
    }
  });

  gulp.watch("assets/*.**").on('change', browserSync.reload);
});

// PUBLISH TO GITHUB PAGES
gulp.task('ghPages', function() {
  console.log(colors.rainbow('⬤  Publish to Github Pages... ⬤'));

  return gulp.src('build/**/*')
    .pipe(ghPages());
});

gulp.task('publish', ['clean'], function (done) {
  gulpSequence(['copy', 'make-index'], 'ghPages')(done);
});
