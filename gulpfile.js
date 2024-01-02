import gulp from 'gulp';
import sassModule from 'gulp-sass';
import sassCompiler from 'sass';
import uglify from 'gulp-uglify';
import sort from 'gulp-sort';
import wrap from 'gulp-wrap';
import concat from 'gulp-concat';
import jsbeautifier from 'gulp-jsbeautifier';
import uglifycss from 'gulp-uglifycss';
import rename from "gulp-rename";
import browserSync from 'browser-sync';
import fs from 'fs';
import git from 'gulp-git'
import dotenv from 'dotenv'

dotenv.config()


const sass = sassModule(sassCompiler);
const sync = browserSync.create();



// Load config.json
const config = JSON.parse(fs.readFileSync('./config.json'));

// Asynchronously import stripDebug
async function getStripDebug() {
  if (!getStripDebug.stripDebug) {
    const stripDebugModule = await import('gulp-strip-debug');
    getStripDebug.stripDebug = stripDebugModule.default;
  }
  return getStripDebug.stripDebug;
}

// SCSS to CSS conversion
const scssToCss = () => {
  return gulp.src('./scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(rename('style.min.css'))
    .pipe(uglifycss({ "uglyComments": true }))
    .pipe(gulp.dest('./dist/'))
    .pipe(sync.stream());
}

async function processScriptsForProd(fileName, section) {
  let domain = config.productionUrl;
  let stream = gulp.src(`./scripts/${section}/*.js`)
    .pipe(sort())
    .pipe(concat('combined.js'));

  if (config.debug === false) {
    const stripDebug = await getStripDebug();
    stream = stream.pipe(stripDebug());
    
  }

  // Apply wrap after minification/beautification
  stream = stream.pipe(wrap(`(function(){ if (window.location.href.indexOf("${domain}") !== -1) {<%= contents %>} })();`))
    .pipe(concat(`${section}-${fileName}`));
  

  if (config.minify) {
    stream = stream.pipe(uglify());
  } else {
    stream = stream.pipe(jsbeautifier({ indent_size: 2 }));
  }


  return stream.pipe(gulp.dest('./dist'));
}

function commitAndPushSpecificFile(filePath) {
  return function(done) {
    const commitMessage = `Gulp Commit: Updating ${filePath}`
    const remote = 'origin'
    const branch = process.env.GIT_BRANCH ? process.env.GIT_BRANCH : 'main'

    git.exec({ args: 'reset' }, function(err) {
      if (err) throw err

      gulp.src(filePath, { base: '.' })
        .pipe(git.add({ args: '-f' }))
        .pipe(git.commit(commitMessage))
        .on('end', function() {
          git.push(remote, branch, { args: '--no-verify' }, function(error) {
            if (error) {
              console.error('ERROR PUSHING TO GIT:', error)
            } else {
              console.log(`SUCCESSFULLY PUSHED ${filePath} TO GIT`)
            }
            done()
          })
        })
    })
  }
}

gulp.task('commit-dist', function() {
  const files_to_stage = './dist/'
  const commit_message = 'Gulp Commit: Updating dist/ files.'

  const remote = 'origin'
  const branch = process.env.GIT_BRANCH ? process.env.GIT_BRANCH : 'main'

  gulp.src(files_to_stage)
  .pipe(git.add())
  .pipe(git.commit(commit_message))
  .on('end', function(){
    git.push(remote, branch, function(error){
      if(error){
        console.error('ERROR PUSHING TO GIT:', error)
      } else {
        console.log("SUCCESSFUL PUSH TO GIT")
      }
      done()
    })
  })

})

gulp.task('commit-scripts', function(){
  const files_to_stage = './scripts/'
  const commit_message = 'Gulp Commit: Updating script/ files.'

  const remote = 'origin'
  const branch = process.env.GIT_BRANCH ? process.env.GIT_BRANCH : 'main'

  gulp.src(files_to_stage)
  .pipe(git.add())
  .pipe(git.commit(commit_message))
  .on('end', function(){
    git.push(remote, branch, function(error){
      if(error){
        console.error('ERROR PUSHING TO GIT:', error)
      } else {
        console.log("SUCCESSFUL PUSH TO GIT")
      }
      done()
    })
  })
})

// Function to process scripts for staging
function processScriptsForStaging(fileName, section) {
  let domain = config.stagingUrl;
  return gulp.src(`./scripts/${section}/*.js`)
    .pipe(sort())
    .pipe(concat('combined.js'))
    .pipe(wrap(`(function(){ if (window.location.href.indexOf("${domain}") !== -1) {<%= contents %>} })();`))
    .pipe(jsbeautifier({ indent_size: 2 }))
    .pipe(concat(`${section}-${fileName}`))
    .pipe(gulp.dest('./dist'));
}

gulp.task('commit-prod', commitAndPushSpecificFile('./dist/prod.js'))

gulp.task('commit-staging', commitAndPushSpecificFile('./dist/staging.js'))

// Production build task
gulp.task('build-prod', async function() {
  // Compile SCSS
  scssToCss();

  // Compile scripts for production
  await processScriptsForProd('prod.js', 'footer');
  await processScriptsForProd('prod.js', 'header');
});

// Staging build task
gulp.task('build-staging', async function() {
  // Compile SCSS for staging
  scssToCss();

  // Process scripts for staging
  await processScriptsForStaging('staging.js', 'footer');
  await processScriptsForStaging('staging.js', 'header');
});


gulp.task('commit-all', gulp.parallel('commit-dist', 'commit-scripts'))

gulp.task('build-commit-all', gulp.series(gulp.parallel('build-prod', 'build-staging'), 'commit-all'))

// Default task
gulp.task('default', gulp.parallel('build-prod', 'build-staging'));
