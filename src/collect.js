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
    window.addEventListener('DOMContentLoaded', ()=>{
        window.wta = new WtaCollector("https://back.psj2867.com");
        wta.start();
    });
}else{
    console.info("import faceapi & webgazer error")
}