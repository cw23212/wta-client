// import html2canvas from "/node_modules/html2canvas/dist/html2canvas.esm.js"
import html2canvas from "html2canvas"

const idleAsync = async (f) => {
    return new Promise(r => {
        requestIdleCallback(async () => {
            r(await f());
        })
    })
}
function setLimitRange(v, l, u){
    if(v<l){
        v=l;
    }else if(u<v){
        v=u;
    }
    return v;
}
class FaceCollector {
    constructor(wta) {
        this.wta = wta;
    }
    initModel() {
        return this.idleInitModel()
    }
    async idleInitModel() {
        var modelPath = "https://psj2867.com/tmp/capstone/model";
        await idleAsync(async () => { await faceapi.loadSsdMobilenetv1Model(modelPath) })
        await idleAsync(async () => { await faceapi.loadFaceExpressionModel(modelPath) })
    }
    setVideo(videoEle) {
        this.videoEle = videoEle;
    }
    async getExp() {
        const detection = await faceapi.detectSingleFace(this.videoEle).withFaceExpressions();
        return detection;
    }
    collectInterval(interval) {
        this._interval = setTimeout(async () => {
            let r = await idleAsync(async () => await this.getExp())
            if(r){
                this.wta.collectFace(r)
            }
            if (this._interval === false) { return; }
            this.collectInterval(interval)
        }, interval);
    }
    async start(videoEle) {
        await this.initModel();
        this.setVideo(videoEle);
        this.collectInterval(1000 * 3);
    }
    stop() {
        this._interval = false;
        clearTimeout(this._interval);
    }

}
class YoloCollector{
    constructor(wta) {
        this.wta = wta;
    }
    preprocess(source, modelWidth, modelHeight){
        let xRatio, yRatio; // ratios for boxes
        const input = tf.tidy(() => {
            const img = tf.browser.fromPixels(source);
            // padding image to square => [n, m] to [n, n], n > m
            const [h, w] = img.shape.slice(0, 2); // get source width and height
            const maxSize = Math.max(w, h); // get max size
            const imgPadded = img.pad([
                [0, maxSize - h], // padding y [bottom only]
                [0, maxSize - w], // padding x [right only]
                [0, 0],
            ]);

            xRatio = maxSize / w; // update xRatio
            yRatio = maxSize / h; // update yRatio

            return tf.image
                .resizeBilinear(imgPadded, [modelWidth, modelHeight]) // resize frame
                .div(255.0) // normalize
                .expandDims(0); // add batch
        });
        return [input, xRatio, yRatio];
    };
    indexOfMax(arr) { 
        return arr.reduce((maxIndex, elem, i, arr) =>  
            elem > arr[maxIndex] ? i : maxIndex, 0); 
    } 
    mappping(d){
        const zip= rows=>rows[0].map((_,c)=>rows.map(row=>row[c]))
        const map = [
            "기쁨",
            "분노",
            "불안",
            "슬픔",
            "중립",
        ];
        // let i = indexOfMax(d)
        return map.reduce((r, l, i )=> Object.assign(r, {[l]:d[i] }), {})
    }
    async predict(inputImg) {
        let r = tf.tidy(()=>{
            const [modelWidth, modelHeight] = this.yolov8.inputs[0].shape.slice(1, 3)// get model width and height
            const [input, xRatio, yRatio] = this.preprocess(inputImg, modelWidth, modelHeight); // preprocess image
            const resT = this.yolov8.predict(input); // inference model
            let res = resT.dataSync();            
            return this.mappping(res);
        })
        return r
    }
    prevMemory = 0;
    memory(){
        console.info(tf.memory().numTensors - prevMemory )
        prevMemory = tf.memory().numTensors
    }
    async startInterval(){
        this._interval = setInterval(async () => {
            let res = await this.predict(this.input)            
            this.wta.collectFace(res);
        }, 1000*0.2);
    }
    async stopInterval(){
        clearInterval(this._interval )
    }
    async start(input, modelUrl) {
        this.input = input;
        const yolov8 = await tf.loadGraphModel(modelUrl);
        const dummyInput = tf.ones(yolov8.inputs[0].shape);
        const warmupResults = yolov8.execute(dummyInput);
        tf.dispose([warmupResults, dummyInput]);
        this.yolov8 = yolov8;
        this.startInterval();
    }
    async stop(){
        this.stopInterval()
    }
}
class EyeCollector {
    debug = false
    pageHeight = document.body.scrollHeight;
    pageWidth = document.body.scrollWidth;
    clockStart = 0
    constructor(wta) {
        this.wta = wta;
    }
    offDebug() {
        webgazer.showVideo(false);
        webgazer.showFaceOverlay(false);
        webgazer.showFaceFeedbackBox(false);
        webgazer.showPredictionPoints(false);
    }
    setDefault() {
        webgazer.setGazeListener((data, elapsedTime) => {
            if (data == null) { return; }
            var x = data.x;
            var y = data.y;
            let ratioX = x / this.pageWidth
            let ratioY = ( window.scrollY + y ) / this.pageHeight
            ratioX = setLimitRange(ratioX, 0, 1);
            ratioY = setLimitRange(ratioY, 0, 1);
            // console.info(data,elapsedTime)
            this.wta.collectEye(ratioX, ratioY);
        });
        webgazer.applyKalmanFilter(true);
        
        this.clockStart = performance.timeOrigin + performance.now();
        if(!this.debug){
            webgazer.saveDataAcrossSessions(false);
            this.offDebug();
        }
    }
    startStaticEyeTracking(videoEle) {
        webgazer.setStaticVideo(videoEle.captureStream());
        return this.start()
    }
    start() {
        this.setDefault();
        webgazer.begin();
        return new Promise((r)=>{
            let getCanvas = ()=>{
                let canvas = webgazer.getVideoElementCanvas()
                if(canvas){
                    r(canvas)
                }else{
                    setTimeout(() => {
                        getCanvas();
                    }, 100);
                }
            }
            getCanvas();
        })        
    }

    stop() {
        webgazer.pause();
    }
}

class ScrollCollector {
    pageHeight = document.body.scrollHeight;
    pageWidth = document.body.scrollWidth;
    windowHeight = window.innerHeight;
    constructor(wta) {
        this.wta = wta;
    }
    interval = 1000 * 1;
    start() {
        this._interval = setInterval(() => {            
            let d = window.scrollY /   ( this.pageHeight - window.innerHeight)
            d = setLimitRange(d, 0, 1);
            if(!d) d=0;
            this.wta.collectScroll(d);
        }, this.interval)
    }
    stop() {
        clearInterval(this._interval)
    }
}
function toBlob(canvasEle){
    return new Promise((r)=>{
        canvasEle.toBlob((b)=>{
            r(b);
        },"image/png");
    })
}

class UtilCollector {
    
    static getProperScreenSize(maxWidth){
        const [pageWidth, pageHeight] = [document.body.scrollWidth, document.body.scrollHeight]
        if(window.width < maxWidth){ return 1 }
        const scale = (maxWidth) / pageWidth;
        console.info("scale=", scale,"width=",pageWidth, "height=", pageHeight);
        return scale;

    }
    static sendScreenshot(url, sid){     
        return new Promise((r)=>{
            setTimeout(async () => {
                r(await UtilCollector._sendScreenshot(url, sid))
            }, 1000 * 1);       

        })  
    }
    static async _sendScreenshot(url, sid) {
        const [windowWidth, windowHeight] = [document.body.scrollWidth, document.body.scrollHeight]
        const screenshotTarget = document.body;
        function fnIgnoreElements(el) {
            if (typeof el.shadowRoot == 'object' && el.shadowRoot !== null) 
              return true
        }
        let canvas = await idleAsync(async () => {
            let scale = UtilCollector.getProperScreenSize(700);
            return await html2canvas(screenshotTarget,{
                allowTaint: true,
                useCORS: true,
                ignoreElements: fnIgnoreElements,
                windowWidth, windowHeight,
                scale,
            })
        });
        await idleAsync(async () => {
            const width = canvas.width;
            const height = canvas.height;
            let imageData = await toBlob(canvas);             
            if(!imageData){
                throw "null image"
            }
            const formData = new FormData();
            formData.append("file", imageData, sid);
            formData.append("sid", sid);
            formData.append("page", location.href);
            formData.append("width", width);
            formData.append("height", height);
            
            await fetch(url, {
                method: "POST",                
                body: formData,
                mode: 'cors'
            })
        });
        console.info("send screenshot");
    }

}


export {
    EyeCollector,
    FaceCollector,
    YoloCollector,
    ScrollCollector,
    UtilCollector
}