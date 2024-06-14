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
    window.WtaCollector = WtaCollector;    

    
class ExpChart{    
    constructor(){        
        this.initCanvas();
        this.initChart(this.canvas);
    }
    initCanvas(){
        this.canvas = document.createElement("canvas");      
        let canvas = this.canvas;
        canvas.style = `
        position: absolute;
        right: 0;
        top: 0;
        height: 200px;
        width: 200px;
        `
        document.body.appendChild(this.canvas);
    }
    initChart(canvas){
        this.chart = new Chart( canvas, {
            type: 'bar',
            options: {
                responsive: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                    suggestedMin: 0,
                    suggestedMax: 1,
                    }
                }
            },
            data: {
              labels: [
                    "기쁨",
                    "분노",
                    "불안",
                    "슬픔",
                    "중립",
                ],
              datasets: [
                {                  
                  data: [],
                }
              ]
            },
          });
    }
    updateData(d){
        this.chart.data.datasets[0].data = d;
        this.chart.update();
    }
}
alert = console.info
window.addEventListener('DOMContentLoaded', ()=>{
    let e = new ExpChart();
    const types = [
                        "기쁨",
                        "분노",
                        "불안",
                        "슬픔",
                        "중립",
                    ]
    handler = (d)=>{        
        if(d.type == "face"){        
            e.updateData(types.map((x)=>d[x]))
        }
    }
    let wta = new WtaCollector("http://n2.psj2867.com:18080", handler);
    wta.eyeCollector.debug= true;
    delete webgazer.params.camConstraints.video.facingMode;
    window.wta =wta;
    // wta.startVideo(document.getElementById("id"))
    wta.start();
});
}else{
    console.info("import faceapi & webgazer error")
}

