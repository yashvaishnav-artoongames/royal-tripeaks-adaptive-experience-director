// Which configuration actually hits the targets? Sweep, do not guess.
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
let OUTR=null;
eval(js + `
function trial(name,tweak){
  ecApplyIntensity(0.60);
  tweak();
  const S={n:0,empty:0,dealt:0,dead:0,cleared:0,blank5:0,blankOver:0,
           b13:{n:0,empty:0,cleared:0},b46:{n:0,empty:0,cleared:0},
           maxEmptyRun:0,maxBlank:0,boards:0,won:0,rescPerBoard:0};
  for(let li=0;li<LEVELS.length;li++){
    for(const ti of [3,4]){
      for(let s=0;s<1;s++){
        let lv=null;
        try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)+s*7717); }catch(e){ continue; }
        if(!lv)continue;
        srand(3300+li*29+ti*13+s);
        SILENT=true;
        for(let mv=0;mv<900;mv++){
          if(N-cl.size===0)break;
          const lg=legals();
          if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
          else if(deckLeft()>0)draw();
          else break;
        }
        if(N-cl.size===0){SILENT=false;continue;}
        S.boards++;
        let run=0;
        for(let t=0;t<8&&N-cl.size>0;t++){
          const before=N-cl.size;
          ecStart(t%2?5:3,t%2?'coins':'ad');
          if(!EC)break;
          for(let mv=0;mv<400;mv++){
            if(N-cl.size===0)break;
            const lg=legals();
            if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
            else if(deckLeft()>0)draw();
            else break;
          }
          S.n++;S.rescPerBoard++;
          const dealt=EC.story.length, cleared=EC.cleared;
          const dead=EC.story.filter(function(x){return x.cleared===0;}).length;
          S.dealt+=dealt;S.dead+=dead;S.cleared+=cleared;
          let r2=0,mx=0;
          EC.story.forEach(function(x){if(x.cleared===0){r2++;if(r2>mx)mx=r2;}else r2=0;});
          if(mx>S.maxBlank)S.maxBlank=mx;
          if(mx>2)S.blankOver++;
          const isEmpty=(cleared===0);
          if(isEmpty){S.empty++;run++;if(run>S.maxEmptyRun)S.maxEmptyRun=run;}else run=0;
          const bk=before<=3?'b13':(before<=6?'b46':null);
          if(bk){S[bk].n++;if(isEmpty)S[bk].empty++;S[bk].cleared+=cleared;}
          if(N-cl.size===0){S.won++;break;}
        }
        SILENT=false;
      }
    }
  }
  return {name:name,
    empty:100*S.empty/S.n, e13:S.b13.n?100*S.b13.empty/S.b13.n:0,
    e46:S.b46.n?100*S.b46.empty/S.b46.n:0,
    c13:S.b13.n?S.b13.cleared/S.b13.n:0,
    maxEmptyRun:S.maxEmptyRun, maxBlank:S.maxBlank,
    blankOver:100*S.blankOver/S.n,
    share13:100*S.b13.n/S.n, n:S.n,
    perBoard:S.boards?S.rescPerBoard/S.boards:0};
}
const R=[];
R.push(trial('as shipped', function(){}));
R.push(trial('endCap 2', function(){EC_TUNE.endCap=2;}));
R.push(trial('endCap 1', function(){EC_TUNE.endCap=1;}));
R.push(trial('endCap 1 + low empty', function(){EC_TUNE.endCap=1;
  EC_TUNE.emptyRate={edge:0.04,close:0.06,far:0.15,remote:0.20};}));

OUTR=R;
`);
console.log('');
console.log('  CONFIGURATION SWEEP  (intensity 0.60, targets in brackets)');
console.log('');
console.log('  config                  n    empty    1-3     4-6   cl/resc   share    max    max');
console.log('                              [10-20] [20-25]  [<5]   1-3[1.5]   1-3    empty  blank');
OUTR.forEach(r=>{
  console.log('  '+r.name.padEnd(22)+String(r.n).padStart(4)+
    '   '+(r.empty.toFixed(0)+'%').padStart(5)+
    '  '+(r.e13.toFixed(0)+'%').padStart(5)+
    '  '+(r.e46.toFixed(0)+'%').padStart(5)+
    '     '+r.c13.toFixed(1).padStart(4)+
    '   '+(r.share13.toFixed(0)+'%').padStart(5)+
    '    '+String(r.maxEmptyRun).padStart(3)+
    '    '+String(r.maxBlank).padStart(3));
});
console.log('');
