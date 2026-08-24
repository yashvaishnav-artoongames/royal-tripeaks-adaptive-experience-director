const ROOT=require('path').join(__dirname,'..','index.html');
const BASE=process.env.AED_BASELINE||ROOT;
// The 27 failures were all the same shape: a lose target, on a live level, that won.
// Test exactly that population, old build against new, identical seeds.
const fs=require('fs'),vm=require('vm');
function ctx(file){
  const src=fs.readFileSync(file,'utf8');
  const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
  let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
  const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
  const store={};
  const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',title:'',style:{},
    dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},appendChild(){},
    setAttribute(){},classList:{toggle(){},add(){},remove(){}},set disabled(v){},
    get disabled(){return false;},click(){},files:[],offsetWidth:1});
  ids.forEach(id=>store[id]=mk(id));
  const fb={set disabled(v){},get disabled(){return false;}};
  const s={document:{getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
      querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
      body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}},
    window:{addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},
    setTimeout:()=>0,console:console,R:null};
  vm.createContext(s); vm.runInContext(js,s); return s;
}
const LEVELS_TO_TEST=process.argv[2]||'0,25';
const [F,T]=LEVELS_TO_TEST.split(',').map(Number);

function run(file){
  const s=ctx(file);
  s.FROM=F; s.TO=T;
  vm.runInContext(`
  ecApplyIntensity(0.5);
  STREAK_REWARD.type='ExtraCards';STREAK_REWARD.amount=1;
  R=[];
  for(let li=FROM;li<Math.min(LEVELS.length,TO);li++){
    for(const ti of [3,4]){          // Close Lose, Comfortable Lose
      for(let p=0;p<3;p++){
        let lv=null;
        try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)+p*104729); }catch(e){}
        if(!lv)continue;
        srand(6100+li*53+ti*17+p*7);
        SILENT=true;
        let win=null,v=null,threw=null;
        try{
          for(let mv=0;mv<1200;mv++){
            if(N-cl.size===0){win=true;v=deckLeft();break;}
            const lg=legals();
            if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
            else if(deckLeft()>0)draw();
            else {win=false;v=N-cl.size;break;}
          }
        }catch(e){threw=e.message;}
        SILENT=false;
        R.push({level:LEVELS[li].short,ti:ti,p:p,mode:lv.usedMode,
          tv:LV.tv,win:win,v:v,threw:threw,
          rungs:SUPPLY_LOG.map(function(c){return c.status;}).join('/')});
      }
    }
  }`,s);
  return s.R;
}
const A=run(BASE);
const B=run(ROOT);
function score(R){
  const ok=R.filter(r=>!r.threw&&r.win!==null);
  const live=ok.filter(r=>r.mode===4);
  return {n:ok.length,
    fails:ok.filter(r=>r.win===true).length,           // a lose target that won
    liveN:live.length,
    liveFails:live.filter(r=>r.win===true).length,
    exact:ok.filter(r=>r.win===false&&r.v===r.tv).length,
    threw:R.filter(r=>r.threw).length};
}
const a=score(A), b=score(B);
const pct=(x,y)=>y?((100*x/y).toFixed(1)+'%'):'-';
console.log('');
console.log('  LOSE TARGETS, levels '+F+'-'+T+', 3 passes each');
console.log('');
console.log('                          before    after');
console.log('  runs                   '+String(a.n).padStart(7)+String(b.n).padStart(9));
console.log('  lose targets that WON  '+String(a.fails).padStart(7)+String(b.fails).padStart(9)+
  '     ('+pct(a.fails,a.n)+' -> '+pct(b.fails,b.n)+')');
console.log('  of which on live       '+String(a.liveFails).padStart(7)+String(b.liveFails).padStart(9));
console.log('  landed on exact tv     '+String(a.exact).padStart(7)+String(b.exact).padStart(9)+
  '     ('+pct(a.exact,a.n)+' -> '+pct(b.exact,b.n)+')');
console.log('  exceptions             '+String(a.threw).padStart(7)+String(b.threw).padStart(9));
console.log('');
// did any run get WORSE?
const key=r=>r.level+'|'+r.ti+'|'+r.p;
const mapA={},mapB={};
A.forEach(r=>mapA[key(r)]=r); B.forEach(r=>mapB[key(r)]=r);
let fixed=0,broken=0,same=0;
Object.keys(mapA).forEach(k=>{
  const x=mapA[k],y=mapB[k]; if(!y||x.threw||y.threw)return;
  const xf=(x.win===true), yf=(y.win===true);
  if(xf&&!yf)fixed++; else if(!xf&&yf)broken++; else same++;
});
console.log('  per-run: '+fixed+' fixed, '+broken+' newly broken, '+same+' unchanged');
console.log('');
if(broken){
  console.log('  NEWLY BROKEN:');
  Object.keys(mapA).forEach(k=>{
    const x=mapA[k],y=mapB[k]; if(!y||x.threw||y.threw)return;
    if(!(x.win===true)&&(y.win===true))
      console.log('    '+y.level+' ti'+y.ti+' p'+y.p+'  tv '+y.tv+
        '  mode '+y.mode+'  rungs '+(y.rungs||'-'));
  });
  console.log('');
}
