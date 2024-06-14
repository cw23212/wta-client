class FloatingEle{
    constructor(targetEle){
        this.targetEle = targetEle;
        this.setNone();
        this.duration = 1000 * 6;
    }
    
    toCss(style){
        return Object.entries(style).map(([k, v]) => `${k}:${v}`).join(';');
    }
    setCss(css){
        this.targetEle.style = this.toCss(css);
    }
    setPosition(x,y){
        this.setCss({            
            "position": "fixed" ,
            "left": x + "px",
            "top": y +"px"
        })
    }
    setNone(){
        this.setCss({
            "display" : "none"
        })
    }

    xAni = {
        transform : [
        'translateX(0vw)',
        'translateX(100vw)'
        ]
    };
    yAni = {
        transform : [
        'translateY(0vh)',
        'translateY(-100vh)'
        ]
    };
    sleep = ms => new Promise(r => setTimeout(r, ms));
    async sleepV(t,v){
        await this.sleep(t);
        return v;
    }
    async setAnimate(ani){
        let time = this.duration;
        this.targetEle.animate(ani,{
            duration: time,
        });
        let click = new Promise((r,j)=>this.targetEle.onclick = ()=>{r(true);})
        let res = await Promise.race( [ this.sleepV(time, false), click ] );
        this.setNone();
        return res;
    }
    move(x,y, ani){
        if(this.isRunning()) return this.sleepV(0, false);
        this.setPosition(x,y);
        return this.setAnimate(ani);
    }
    moveX(x,y){
        return this.move(x,y,this.xAni);
    }
    moveY(x,y){
        return this.move(x,y,this.yAni);
    }
    isRunning(){
        return this.targetEle.checkVisibility()
    }
    randomX(){
        let x = Math.random() * window.innerWidth;
        let y = window.innerHeight;        
        return this.moveY(x,y);
    }
    static fromTemplate(template){
        let cloneNode = document.importNode(template.content, true);
        document.body.appendChild(cloneNode);
        let newNode = document.body.lastElementChild;        
        let n = new FloatingEle(newNode);
        n.remove = ()=>{
            n.targetEle.remove();
        }
        return n;
    }
}