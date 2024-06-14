// const faceapi = require("@vladmandic/face-api");
// const webgazer = require("webgazer");

import "./setenv"

import * as tf from '@tensorflow/tfjs';
import {env} from "@tensorflow/tfjs-core"
// import * as faceapi from "@vladmandic/face-api"
import webgazer from "webgazer"

import {WtaCollector} from "./wta.js"

if(window){
    // window.faceapi=faceapi;    
    window.webgazer =webgazer;
    window.tfEnv =env;
    window.tf =tf;    
    // window.wta = new WtaCollector("http://n2.psj2867.com:18080");
    window.WtaCollector = WtaCollector;
}else{
    console.info("import faceapi & webgazer error")
}