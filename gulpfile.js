//gloval変数用空間
gloval={};

//OS判定 node.jsモジュールのosを利用
const os = require('os');
console.log(os.platform());
switch (os.platform()) {
  case 'win32':
    gloval.file_name_split_string = '\\';
    console.log('os is win32');
    break;
  case 'darwin':
    gloval.file_name_split_string = '/';
    console.log('os is darwin');
    break;
  default:
    gloval.file_name_split_string = '\\';
    console.log('os is undefined, win32 fixed');
}

// gulp:gulpメイン
const {src, dest, watch, series, parallel} = require("gulp");

//fs:node.jsモジュールのfs。絶対pathの判定用
const fs = require('fs');

// sass:scssファイルをcssファイルに変換
const sass = require('gulp-sass');

// autoprefixer:CSSベンダープレフィックス自動付与
const autoprefixer = require('gulp-autoprefixer');

// gulp-plumber:エラー発生時でもgulp-wacthを停止させない
const plumber = require('gulp-plumber');

//gulp-data:ファイルパス利用の為に使用
const data = require('gulp-data');

// uglify:JavaScriptファイルの自動圧縮
const uglify = require('gulp-uglify');

// gulp-ejs:ejsファイルをhtmlに変換
const ejs = require('gulp-ejs');

// gulp-rename:ejs出力ファイル名を変更する
const rename = require('gulp-rename');

// browserSync:htmlファイルをブラウザで表示（localhost:3000にhttp接続）
const browserSync = require('browser-sync').create();

//gulp-changed:出力先ファイルの差分確認
const changed = require('gulp-changed');

//ejs→html
function html(cb) {
  console.log("ejs→html");
  return src(['ejs/**/*.ejs', '!' + 'ejs/**/_*.ejs'])
    .pipe(data(file => {
        const root_path = file.path.split(gloval.file_name_split_string+'ejs')[0] + gloval.file_name_split_string +'ejs';
        const filename = file.path;
        gloval.htmlroot = root_path;
        return {
          gloval,
          filename
        };
      }),)
    .pipe(changed('html'))
    .pipe(ejs({},{gloval:gloval},{'ext': '.html'}))
    .pipe(rename({extname: '.html'}))
    .pipe(dest('html'));
}

//scss→css
function sassCompress(cb) {
  console.log("scss→css");
  return src(['sass/**/*.scss', '!' + 'sass/**/_*.scss'])
  .pipe(plumber())
  .pipe(sass({
    outputStyle: 'compressed'
    // compressed:圧縮
    // expanded:通常(展開)
  }))
  //GAユーザーデータに基づくブラウザ
  .pipe(autoprefixer({
      //browsers: ['last 2 version', 'ie >= 9', 'iOS >= 10', 'Android >= 4'],//記述をpackege.jsonに移行
      cascade: false,
      grid: true
  }))
  .pipe(dest('html/css'));
}

//js→minjs
function jsCompress(cb) {
  console.log("js→minjs");
  return src(['js/**/*.js', '!js/min/**/*.js'])
    .pipe(plumber())
    .pipe(uglify())
    .pipe(dest('html/js'));
}

const browserSyncOption = {
  port: 3000,
  server: {
    baseDir: './html/',
    index: 'index.html',
  },
  reloadOnRestart: true,
};

function server(cb) {
  browserSync.init(browserSyncOption);
  cb();
}

function fileWatcher(cb) {
  function browserReload(cb){
    browserSync.reload();
    console.log("browserSync.reload");
    cb();
  };
  watch(['sass/**/*.scss', '!sass/**/*.css'], {interval: 500}, series(sassCompress, browserReload));
  watch(['js/**/*.js', '!js/min/**/*.js'], {interval: 500}, series(jsCompress, browserReload));
  watch('ejs/**/*.ejs', {interval: 500}, series(html, browserReload));
}

exports.default = series(parallel(html, sassCompress, jsCompress), series(server, fileWatcher));
