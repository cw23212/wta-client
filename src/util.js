
export function offDebug(){
    webgazer.showVideo(false);
    webgazer.showFaceOverlay(false);
    webgazer.showFaceFeedbackBox(false);
    // webgazer.showPredictionPoints(false);
}

export async function start(streamVideo){
    webgazer.setGazeListener(function(data, elapsedTime) {          
        if (data == null) { return; }
        var xprediction = data.x; 
        var yprediction = data.y; 
        // console.log(data)
    });
    webgazer.setStaticVideo(streamVideo.captureStream());
    offDebug();
    webgazer.begin();

    modelPaht = "/face-api.js/weights";
    await faceapi.loadSsdMobilenetv1Model(modelPaht);
    await faceapi.loadFaceExpressionModel(modelPaht);    
    console.info("ready");
    
}

export async function getExp(){
    const input = streamVideo;
    const detection = await faceapi.detectSingleFace(input)
    .withFaceExpressions();
    return detection;

}

