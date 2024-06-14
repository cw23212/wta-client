import * as Collectors from "./Collector.js"
class AnalyizeEye{
    constructor(wta){
        this.wta = wta;
    }
    
    startAnlize(time, h=()=>{}){
        self = this;
        function f(){
            let maxError = self.maxRecentMeanErr([self.wta.pre, self.wta.buffer],1, 50);
            console.info(maxError);
            if( 0 < maxError && maxError <  50){
                h();
                self.stopAnalize();
                setTimeout(()=>{
                    self.startAnlize(time,h);
                }, time * 3);
            }
        };
        
        this.interval = setInterval(f, time);
    }
    stopAnalize(){
        clearInterval(this.interval);
    }

    isEye(r){
        if(!r) return false;
        return r.type == "eye";
    }
    ieRecentEye(t){
        let after = (this.wta.loadTime + performance.now()) *1000 - t * 1000 *1000;
        return (r)=>{
            return after < r.time && this.isEye(r);
        }
    }
    getLast(ls, n, p){
        let res = [];
        for (let listI = ls.length-1 ; 0 <= listI; listI--) {
            const tl = ls[listI];
            for (let i = tl.length -1; 0 <= i; i--) {
                const e = tl[i];
                if(p(e)){
                    res.push(e);
                    if(res.length ==n){
                        return res;
                    }
                }
            }
        }
        return res;
    }

    maxRecentMeanErr(ls, t, n){
        let last = this.getLast(ls,n,this.ieRecentEye(t))
            .map((r)=>{
                return [r.ratioX*this.wta.pageWidth, r.ratioY*this.wta.pageHeight]
            });
        let sum = last.reduce((a,b)=>{
                return [a[0]+b[0], a[1]+b[1]];
            },[0,0]);
        let len = last.length;
        let mean = [sum[0]/len, sum[1]/len];
        let err = last.map(r=>{
            let x = r[0]-mean[0];
            let y = r[1]-mean[1];
            return Math.sqrt(x*x + y*y);
        });
        return Math.max(...err)
    }
}

class WtaCollector{
    eyeAnalize = new AnalyizeEye(this)
    eyeCollector = new Collectors.EyeCollector(this)
    // faceCollector = new Collectors.FaceCollector(this)
    scrollCollector = new Collectors.ScrollCollector(this)
    faceCollector = new Collectors.YoloCollector(this)
    modelUrl = "https://psj2867.com/tmp/model/model.json"
    buffer = []
    pre = []
    maxSize = 20
    
    constructor(url = "http://n2.psj2867.com:18080", after= ()=>{}){
        this.after =after;        
        this.url = url + "/api/collect/";
        this.screenShotUrl = this.url + "screen"       
        this.setLastFeth();
        window.webgazer = webgazer;
        this.sendMeta();
    }
    randomUUID(){        
        var d = new Date().getTime();//Timestamp
        var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16;//random number between 0 and 16
            if(d > 0){//Use timestamp until depleted
                r = (d + r)%16 | 0;
                d = Math.floor(d/16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r)%16 | 0;
                d2 = Math.floor(d2/16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    sid = this.randomUUID();
    uid = this.randomUUID();
    page = location.href;
    loadTime = performance.timeOrigin;
    pageHeight = document.body.scrollHeight;
    pageWidth = document.body.scrollWidth;
    windowHeight = window.innerHeight;
    getTags(){        
        let sid = this.sid;
        let uid = this.uid;
        let page =  this.page;        
        let time = (this.loadTime + performance.now()) *1000;
        time = Math.floor(time);
        return {sid, uid, page, time}
    }
    setLastFeth(){
        window.addEventListener("beforeunload",()=>{
            this.send();
        });
    }
    async send(){
        try {
            if(this.buffer.length ==0){return}
            let copy = this.buffer;
            this.pre = copy;
            this.buffer = [];
            console.info("send data len=",copy.length);
            let res = await fetch(this.url, {
                method : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(copy),                
            })
        } catch (error) {
            console.error(error);
            this.stop();
        }
    }
    sendIfRequired(){
        if( this.buffer.length >= this.maxSize)
            this.send()
    }
    collect(type, fildes){
        let data = { ...this.getTags(), type, ...fildes}
        this.buffer.push(data);
        this.sendIfRequired();
        this.after(data);
    }
    recentEye = [0,0]
    collectEye(x,y){     
        this.recentEye = [x,y];
        this.collect("eye", {
            "ratioX" : x,
            "ratioY" : y
        });
        // console.info(document.elementFromPoint(x,y));
    }
    collectFace(d){        
        // ["neutral", "happy", "sad", "angry", "fearful", "disgusted", "surprised" ]
        let r = d;
        r["ratioX"] = this.recentEye[0]
        r["ratioY"] = this.recentEye[1]
        this.collect("face", r);
    }
    collectScroll(d){
        this.collect("scroll", {
            "scroll" : d
        });
    }
    async sendMeta(){
        this.collect("meta",{
            pageHeight : this.pageHeight, 
            pageWidth : this.pageWidth,
        });        
        await Collectors.UtilCollector.sendScreenshot(this.screenShotUrl, this.sid);
    }

    async start(){
        let videoEle = await this.eyeCollector.start();        
        this.faceCollector.start(videoEle, this.modelUrl);   
        this.scrollCollector.start();
        return videoEle;
    }
    stop(){
        this.eyeCollector.stop();
        this.faceCollector.stop();    
        this.scrollCollector.stop();

    }
    startVideo(videoEle){
        return new Promise(r=>{
            videoEle.addEventListener("play",async ()=>{
                let eyeVideoEle = await this.eyeCollector.startStaticEyeTracking(videoEle);    
                this.faceCollector.start(eyeVideoEle, this.modelUrl);   
                this.scrollCollector.start();
                r(eyeVideoEle)
            })
            videoEle.addEventListener("pause",()=>{
                this.eyeCollector.stop();
                this.faceCollector.stop();    
                this.scrollCollector.stop();
            })
        })
        
    }

}

export{
    WtaCollector
}