import webpack from "webpack-stream";
import typescript from "gulp-typescript";
const tsProject = typescript.createProject("tsconfig.json");

export const ts = () => {
  return app.gulp.src(app.path.src.ts, { sourcemaps: true })

    .pipe(tsProject())
    .pipe(app.gulp.dest(app.path.build.js))
    .pipe(webpack({
      mode: 'development',
      output: {
        filename: 'main.min.js',
      }
    }))
    .pipe(app.gulp.dest(app.path.build.js))
    .pipe(app.plugins.browsersync.stream())
}


