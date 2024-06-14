#!/usr/bin/env node

const esbuild = require("esbuild");
const { umdWrapper } = require("esbuild-plugin-umd-wrapper");

function index(){
  esbuild
  .build({
    entryPoints: ["./src/index.js"],
    outfile: 'dist/index.js',
    platform: 'browser',   
    // minify: true, 
    format: "umd", // or "cjs"
    bundle: true,
    plugins: [umdWrapper()],
    logLevel: "info", 
  })
  .catch((e) => {
      console.info(e);
      process.exit(1);
  });
}
// index();
function wta(){
  const umdWrapperOptions = {
    libraryName: "wta", // default is unset
  }

  esbuild
    .build({
      entryPoints: ["./src/wta.js"],
      outfile: 'dist/wta.js',
      platform: 'browser',   
      minify: true, 
      format: "umd", // or "cjs"
      bundle: true,
      plugins: [umdWrapper(umdWrapperOptions)],
      logLevel: "info", 
    })
    .catch((e) => {
        console.info(e);
        process.exit(1);
    });
}
// wta();


function collect(){
  esbuild
  .build({
    entryPoints: ["./src/collect.js"],
    outfile: 'dist/collect.js',
    platform: 'browser',   
    // minify: true, 
    format: "umd", // or "cjs"
    bundle: true,
    plugins: [umdWrapper()],
    logLevel: "info", 
  })
  .catch((e) => {
      console.info(e);
      process.exit(1);
  });
}
// collect();



function last(){
  esbuild
  .build({
    entryPoints: ["./src/last.js"],
    outfile: 'dist/last.js',
    platform: 'browser',   
    // minify: true, 
    format: "umd", // or "cjs"
    bundle: true,
    plugins: [umdWrapper()],
    logLevel: "info", 
  })
  .catch((e) => {
      console.info(e);
      process.exit(1);
  });
}
last();