
const { readFile, writeFile } = require('node:fs/promises');


const gulp = require('gulp');

const { remove } = require('fs-extra');
const rename = require("gulp-rename");

const babel = require('gulp-babel');

const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');

const { JSDOM } = require('jsdom');



function mjs() {
    return gulp.src('./src/assets/js/*.mjs', { base: './src' })
                .pipe(babel())
                .pipe(rename({
                    extname: '.mjs',
                }))
                .pipe(gulp.dest('./public'));
}

function service_worker() {
    return gulp.src('./src/*.js', { base: './src' })
                .pipe(babel())
                .pipe(gulp.dest('./public'));
}

function scss() {
    return gulp.src('./src/assets/css/*.scss', { base: './src' })
                .pipe(sass())
                .pipe(autoprefixer())
                .pipe(gulp.dest('./public'));
}

function html() {
    return gulp.src('./src/**/*.html', { base: './src' })
                .pipe(gulp.dest('./public'));
}

function purge() {
    return new Promise(resolve => {
        remove('./public', err => {
            if (err) {
                console.error(err);
            } else {
                console.log('[purge] Remove: ./public');
            }
            resolve();
        });
    });
}

async function webmanifest() {
    const buffer = await readFile('./src/manifest.webmanifest');

    let json = JSON.parse(buffer.toString());
    json.start_url = "/ja";
    json.name = 'ルーレット';
    json.short_name = 'ルーレット';
    json.description = 'カスタマイズ可能なルーレット'

    return await writeFile('./public/manifest-ja.webmanifest', JSON.stringify(json));
}

function copy() {
    const files = [
        './src/**/*.otf',
        './src/**/*.ttf',

        './src/**/*.jpg',
        './src/**/*.png',
        './src/**/*.svg',

        './src/**/*.webmanifest',
        './src/**/*.json',

        './src/**/*.txt',
        './src/.gitkeep'
    ];

    return gulp.src(files, { base: './src' })
                .pipe(gulp.dest('./public'));
}


async function i18n() {
    const buffer = await readFile('./src/index.html');

    const jsdom = new JSDOM(buffer.toString());
    //const { window } = jsdom;
    const { document } = jsdom.window;

    const json = ( await readFile('./src/assets/data/i18n.json') ).toString();

    let i18n_object;
    try {
        i18n_object = JSON.parse(json);

    } catch(err) {
        console.error(err);

        return null;
    }


    document.querySelector('html').setAttribute('lang', 'ja');
    document.querySelector('link[rel="canonical"]').href = "https://roulette.m4k15y6666fk.work/ja/";
    document.querySelector('link[rel="manifest"]').href = "/manifest-ja.webmanifest";
    document.querySelector('meta[property="og:url"]').setAttribute('content', "https://roulette.m4k15y6666fk.work/ja/");

    for (const key of Object.keys(i18n_object)) {
        document.querySelectorAll(`*[data-i18n="${ key }"]`).forEach(el => {
            if (el.tagName.toUpperCase() === 'META') {
                el.setAttribute('content', i18n_object[key].ja);

            } else {
                while (el.firstChild) {
                    el.removeChild( el.firstChild );
                }

                el.insertAdjacentHTML('beforeend', i18n_object[key].ja);
            }
        });
    }

    //await writeFile('./src/ja.html', jsdom.serialize());
    return await writeFile('./public/ja.html', jsdom.serialize());
}



exports.default = gulp.series(
    purge,

    mjs,
    service_worker,
    scss,
    html,
    i18n,
    webmanifest,

    copy
);
