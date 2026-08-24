const fs=require('fs');
const h=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=h.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...h.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};
const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',style:{},value:'0',
  dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},appendChild(){},
  setAttribute(){},classList:{toggle(){},add(){},remove(){}},set disabled(v){},
  get disabled(){return false;},click(){},files:[]});
ids.forEach(id=>store[id]=mk(id));
const fb={set disabled(v){},get disabled(){return false;}};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
  querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
  body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}};
global.window={addEventListener(){}};
global.localStorage={getItem(){return null;},setItem(){}};
global.setTimeout=()=>0;
eval(js + `
// ---- regression: the core director must be untouched by any of this ----------
let okN=0,badN=0,bugs=[];
for(let li=0;li<LEVELS.length;li++){
 for(let ti=0;ti<OUT.length;ti++){
  store['tsel'].value=String(ti);
  let lv=null;
  try{lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti));}catch(e){bugs.push('build threw '+e.message);continue;}
  if(!lv)continue;
  const live=lv.usedMode===4, bd=[OUT[ti].lo,OUT[ti].hi];
  let exact=0,inband=0,held=0,moved=0;
  for(let p=0;p<10;p++){
    const o=botPlay(seedFor(LEVELS[li].short,ti)+7919*(p+1));
    for(const b of o.bugs)if(bugs.indexOf(b)<0)bugs.push(b);
    if(!o.res)continue;
    if(typeof SUPPLY_LOG!=='undefined'&&SUPPLY_LOG.length)moved++;
    if(o.res.win===OUT[ti].win){held++;
      if(o.res.v===lv.tv)exact++;
      if(o.res.v>=bd[0]&&o.res.v<=bd[1])inband++;}
  }
  if(!live){
    // exact only where the deck never moved; otherwise the band is the promise
    const want=(moved===0)?exact:inband;
    if(want===10)okN++;
    else {badN++;bugs.push(LEVELS[li].short+' '+OUT[ti].n+' verified: held '+held+
      ', exact '+exact+', in band '+inband+'/10'+(moved?(' ('+moved+' runs changed the deck)'):''));} }
  else { if(inband>=7)okN++; else {badN++;
    bugs.push(LEVELS[li].short+' '+OUT[ti].n+' LIVE, in band only '+inband+'/10 (band '+
      bd[0]+'-'+bd[1]+')');} }
 }
}
console.log('CORE REGRESSION (rescue never started)');
console.log("  pass "+okN+"   fail "+badN);
console.log('  issues: '+(bugs.length?bugs.slice(0,6).join(' | '):'none'));
console.log('  PHASE after all of it: '+PHASE+'   EC: '+(EC?'leaked':'null'));

// ---- undo through a rescue ---------------------------------------------------
let undoBad=0,undoN=0;
for(let li=0;li<6;li++){
  store['tsel'].value='4';
  const lv=buildFixed(li,4,seedFor(LEVELS[li].short,4));
  if(!lv)continue;
  srand(99+li);SILENT=true;skipToEnd();SILENT=false;
  if(N-cl.size===0)continue;
  SILENT=true;ecStart(5,'coins');SILENT=false;
  const before={left:N-cl.size,runs:ECRUNS,phase:PHASE};
  SILENT=true;
  for(let s=0;s<4;s++){const lg=legals();if(lg.length)play(lg[0]);else if(deckLeft()>0)draw();else break;}
  const mid={left:N-cl.size,rank:JSON.stringify(LV.rank)};
  for(let s=0;s<4;s++)back();
  SILENT=false;
  undoN++;
  if(N-cl.size!==before.left||ECRUNS!==before.runs||PHASE!==before.phase)undoBad++;
}
console.log('');
console.log('UNDO THROUGH A RESCUE: '+(undoN-undoBad)+'/'+undoN+' restored exactly');
`);
