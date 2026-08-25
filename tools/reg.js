const fs=require('fs');
const h=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=h.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);
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
let okN=0,badN=0,bugs=[],LIVEROWS=[],VERROWS=[];
const POLICY=(typeof process!=='undefined'&&process.argv[2])||'random';
if(typeof process!=='undefined'&&process.argv[3])DRAWHAPPY_P=parseFloat(process.argv[3]);
for(let li=0;li<LEVELS.length;li++){
 for(let ti=0;ti<OUT.length;ti++){
  store['tsel'].value=String(ti);
  let lv=null;
  try{lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti));}catch(e){bugs.push('build threw '+e.message);continue;}
  if(!lv)continue;
  const tvBuild=lv.tv, bandLive=lv.band?lv.band.slice():null;
  const live=lv.usedMode===4, bd=[OUT[ti].lo,OUT[ti].hi];
  let exact=0,inband=0,held=0,moved=0,inwide=0;
  for(let p=0;p<10;p++){
    const o=botPlay(seedFor(LEVELS[li].short,ti)+7919*(p+1),POLICY);
    for(const b of o.bugs)if(bugs.indexOf(b)<0)bugs.push(b);
    if(!o.res)continue;
    if(typeof SUPPLY_LOG!=='undefined'&&SUPPLY_LOG.some(function(r){
      return r.status!=='keep'||r.tvMoved!==0;}))moved++;
    if(o.res.win===OUT[ti].win){held++;
      if(o.res.v===tvBuild)exact++;
      if(o.res.v>=bd[0]&&o.res.v<=bd[1])inband++;
      if(bandLive&&o.res.v>=bandLive[0]&&o.res.v<=bandLive[1])inwide++;}
  }
  if(!live){
    // exact only where the deck never moved; otherwise the band is the promise
    const want=(moved===0)?exact:inband;
    VERROWS.push([OUT[ti].win,want===10,held]);
    if(want===10)okN++;
    else {badN++;bugs.push(LEVELS[li].short+' '+OUT[ti].n+' verified: held '+held+
      ', exact '+exact+', in band '+inband+'/10'+(moved?(' ('+moved+' runs changed the deck)'):''));} }
  else { LIVEROWS.push([LEVELS[li].short,OUT[ti].n,held,inband,inwide,exact]);
    if(inband>=7)okN++; else {badN++;
    bugs.push(LEVELS[li].short+' '+OUT[ti].n+' LIVE, in band only '+inband+'/10 (band '+
      bd[0]+'-'+bd[1]+')');} }
 }
}
console.log('CORE REGRESSION (rescue never started)   policy: '+POLICY+
  (POLICY==='drawhappy'?(' @ '+Math.round(DRAWHAPPY_P*100)+'% draw rate'):''));
{let vw=0,vwp=0,vl=0,vlp=0,vh=0,vn=0;
 for(const r of VERROWS){vn+=10;vh+=r[2];if(r[0]){vw++;if(r[1])vwp++;}else{vl++;if(r[1])vlp++;}}
 console.log('  VERIFIED  win pairs '+vwp+'/'+vw+' pass   lose pairs '+vlp+'/'+vl+
   ' pass   outcome held '+vh+'/'+vn+' ('+Math.round(100*vh/vn)+'%)');}
console.log("  pass "+okN+"   fail "+badN);
console.log('  issues: '+(bugs.length?bugs.slice(0,6).join(' | '):'none'));
console.log('  PHASE after all of it: '+PHASE+'   EC: '+(EC?'leaked':'null'));
// live-side aggregate: the behaviour class is now named, so the number means something
let LH=0,LB=0,LW=0,LE=0,LN=0;
for(const r of LIVEROWS){LN+=10;LH+=r[2];LB+=r[3];LW+=r[4];LE+=r[5];}
if(LN){const pc=function(x){return Math.round(100*x/LN)+'%';};
  console.log('');
  console.log('LIVE DIRECTOR ('+LIVEROWS.length+' pairs x10, policy '+POLICY+')');
  console.log('  outcome held      '+LH+'/'+LN+'  '+pc(LH));
  console.log('  in authored band  '+LB+'/'+LN+'  '+pc(LB)+'   (OUT, the promise)');
  console.log('  in advertised band '+LW+'/'+LN+'  '+pc(LW)+'   (liveBand, widened +/-1)');
  console.log('  exact target      '+LE+'/'+LN+'  '+pc(LE));}

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
