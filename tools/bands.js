// Verified coverage is the number underneath everything: every outcome failure is on the
// live side. Which lose-band setting recovers it, and what does it cost?
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',title:'',
  style:{},dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},
  appendChild(){},setAttribute(){},classList:{toggle(){},add(){},remove(){}},
  set disabled(v){},get disabled(){return false;},click(){},files:[],offsetWidth:1});
ids.forEach(id=>store[id]=mk(id));
const fb={set disabled(v){},get disabled(){return false;}};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
  querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
  body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}};
global.window={addEventListener(){}};global.localStorage={getItem(){return null;},setItem(){}};
global.setTimeout=()=>0;
const CFG=JSON.parse(process.argv[2]||'[[1,3,4,6]]');
const FROM=parseInt(process.argv[3]||'0'), TO=parseInt(process.argv[4]||'25');
let OUTR=null;
eval(js + `
ecApplyIntensity(0.5);
STREAK_REWARD.type='ExtraCards';STREAK_REWARD.amount=1;
const res=[];
for(const c of CFG){
  OUT[3].lo=c[0];OUT[3].hi=c[1];OUT[4].lo=c[2];OUT[4].hi=c[3];
  const st={cfg:c.join('/'),n:0,built:0,verified:0,live:0,
            held:0,exact:0,played:0,stranded:[]};
  for(let li=FROM;li<Math.min(LEVELS.length,TO);li++){
    for(const ti of [3,4]){
      for(let p=0;p<2;p++){
        st.n++;
        let lv=null;
        try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)+p*104729); }catch(e){}
        if(!lv)continue;
        st.built++;
        if(lv.usedMode===4)st.live++;else st.verified++;
        srand(6100+li*53+ti*17+p*7);
        SILENT=true;
        let win=null,v=null;
        try{
          for(let mv=0;mv<1200;mv++){
            if(N-cl.size===0){win=true;v=deckLeft();break;}
            const lg=legals();
            if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
            else if(deckLeft()>0)draw();
            else {win=false;v=N-cl.size;break;}
          }
        }catch(e){}
        SILENT=false;
        if(win===null)continue;
        st.played++;
        if(win===false){st.held++;st.stranded.push(v);if(v===LV.tv)st.exact++;}
      }
    }
  }
  res.push(st);
}
OUTR=res;
`);
console.log('');
console.log('  LOSE BANDS vs VERIFIED COVERAGE   (levels '+FROM+'-'+TO+', 2 passes)');
console.log('');
console.log('  bands        runs  built  verified   live   held   exact   avg stranded');
OUTR.forEach(r=>{
  const p=(a,b)=>b?((100*a/b).toFixed(0)+'%'):'-';
  const avg=r.stranded.length?(r.stranded.reduce((a,b)=>a+b,0)/r.stranded.length):0;
  console.log('  '+r.cfg.padEnd(12)+String(r.n).padStart(4)+
    p(r.built,r.n).padStart(7)+p(r.verified,r.built).padStart(10)+
    p(r.live,r.built).padStart(7)+p(r.held,r.played).padStart(7)+
    p(r.exact,r.played).padStart(8)+avg.toFixed(1).padStart(14));
});
console.log('');
