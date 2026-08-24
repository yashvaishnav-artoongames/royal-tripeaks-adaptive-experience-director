const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',title:'',
  style:{cssText:''},dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},
  appendChild(){},setAttribute(){},classList:{toggle(){},add(){},remove(){},contains(){return false;}},
  set disabled(v){},get disabled(){return false;},click(){},files:[],offsetWidth:1});
ids.forEach(id=>store[id]=mk(id));
const fb={set disabled(v){},get disabled(){return false;}};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
  querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
  body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}};
global.window={addEventListener(){}};global.localStorage={getItem(){return null;},setItem(){}};
global.setTimeout=()=>0;
eval(js + `
const idx=LEVELS.findIndex(function(L){return L.short==='L12';});
console.log('');
console.log('  L12 with 3 plus tiles worth 3 each');
console.log('');
console.log('  outcome            band    tv at build   tv at end   unused   in band');
for(let ti=0;ti<OUT.length;ti++){
  document.getElementById('tsel').value=String(ti);
  let lv=null;
  try{ lv=buildFixed(idx,ti,seedFor('L12',ti)); }catch(e){}
  if(!lv){console.log('  '+OUT[ti].n.padEnd(18)+'  build failed');continue;}
  const tv0=lv.tv;
  srand(4242+ti);
  SILENT=true;
  let win=null,v=null;
  for(let s=0;s<900;s++){
    if(N-cl.size===0){win=true;v=deckLeft();break;}
    const lg=legals();
    if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
    else if(deckLeft()>0)draw();
    else {win=false;v=N-cl.size;break;}
  }
  SILENT=false;
  const bd=[OUT[ti].lo,OUT[ti].hi];
  const ok=(win===OUT[ti].win)&&v>=bd[0]&&v<=bd[1];
  console.log('  '+OUT[ti].n.padEnd(18)+(bd[0]+'-'+bd[1]).padStart(5)+
    String(tv0).padStart(13)+String(LV.tv).padStart(12)+String(v).padStart(9)+
    '   '+(ok?'yes':'NO')+(win===OUT[ti].win?'':'   OUTCOME FLIPPED'));
}
console.log('');
console.log('  plan line: '+STRUCT);
`);
