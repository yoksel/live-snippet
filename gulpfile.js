var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var ghPages = require('gulp-gh-pages');
var colors = require('colors/safe');

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

  return gulp.src('*')
    .pipe(ghPages());
});
