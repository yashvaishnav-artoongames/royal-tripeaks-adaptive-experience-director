// PHASE 0, STEP 1b — test the key function directly, not its consequences.
//
// Comparing answers only catches a collision if BOTH colliding states are actually
// visited AND they have different answers. That is a weak detector. This instead
// records every (mlo,mhi,w,dj) state the search visits, computes the key the real code
// would compute, and reports any two DISTINCT states that share one.

const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
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

const RES={};
eval(js + `
// walk exactly like allHit does, but record states instead of answering
function survey(m0lo,m0hi,w0,deck,d0,rank,seen,collide,radix){
  let cap=0;
  const visited=new Set();
  function f(mlo,mhi,w,dj){
    if(++cap>60000)return;
    const exact=mhi+'|'+mlo+'|'+w+'|'+dj;
    if(visited.has(exact))return;
    visited.add(exact);
    const key=mhi+"#"+((mlo*WASTE_RADIX+w)*radix+dj);
    const prev=seen.get(key);
    if(prev===undefined)seen.set(key,exact);
    else if(prev!==exact)collide.push([prev,exact,key]);
    if(mlo===FLO&&mhi===FHI)return;
    const lg=[];
    const Sv=SCROLL?scrollOf(function(z){return !!(z<26?((mlo>>>z)&1):((mhi>>>(z-26))&1));}):0;
    for(let i=0;i<N;i++){
      if(i<26?((mlo>>>i)&1):((mhi>>>(i-26))&1))continue;
      if((mlo&PMLO[i])!==PMLO[i]||(mhi&PMHI[i])!==PMHI[i])continue;
      if(!inView(i,Sv))continue;
      if(cyc(rank[i],w))lg.push(i);
    }
    if(lg.length){
      for(const i of lg){
        const nlo=i<26?(mlo|(1<<i)):mlo, nhi=i<26?mhi:(mhi|(1<<(i-26)));
        f(nlo,nhi,rank[i],dj);}
    } else if(dj<deck.length) f(mlo,mhi,deck[dj][1],dj+1);
  }
  f(m0lo,m0hi,w0,d0);
  return cap;
}
function grownDeck(base,extra){
  const d=base.slice();
  for(let g=0;g<extra;g++){const r=1+Math.floor(rnd()*13);d.push([RN[r]+'\\u2660',r,false]);}
  return d;
}

const report=[];
for(const extra of [0,3,6,20]){
  let states=0, collisions=0, overflowSeen=0, worstDj=0, levels=0;
  for(let li=0;li<LEVELS.length;li++){
    for(let ti=0;ti<OUT.length;ti++){
      let lv=null;
      try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){ continue; }
      if(!lv||lv.usedMode===4)continue;
      levels++;
      srand(999+li*13+ti*5+extra);
      const deck=grownDeck(lv.deck,extra);
      const radix=deck.length+2;
      const seen=new Map(), collide=[];
      const M=maskOf();
      states+=survey(M[0],M[1],lv.seed,deck,0,lv.rank,seen,collide,radix);
      collisions+=collide.length;
      if(deck.length>worstDj)worstDj=deck.length;
      if(deck.length>=radix)overflowSeen++;
    }
  }
  report.push({extra:extra,levels:levels,states:states,collisions:collisions,
               overflowLevels:overflowSeen,worstDj:worstDj});
}
RES.report=report;
RES.radixNote=[];
// also: what is the radix vs the max dj, per level, so the margin is visible
for(let li=0;li<LEVELS.length;li++){
  let lv=null;
  try{ lv=buildFixed(li,3,seedFor(LEVELS[li].short,3)); }catch(e){ continue; }
  if(!lv||lv.usedMode===4)continue;
  RES.radixNote.push({level:LEVELS[li].short,deckN:DECKN,deckLen:lv.deck.length,
                      radix:DECKN+2,slack:(DECKN+2)-lv.deck.length});
}
`);

console.log('');
console.log('  PHASE 0 STEP 1b - do two distinct states ever share a memo key?');
console.log('');
console.log('  cards added   levels   states walked   overflowing levels   COLLISIONS');
RES.report.forEach(r=>{
  console.log('  '+String(r.extra).padStart(8)+'   '+String(r.levels).padStart(6)+
    '   '+String(r.states).padStart(13)+'   '+String(r.overflowLevels).padStart(18)+
    '   '+String(r.collisions).padStart(10));
});
console.log('');
console.log('  margin today (Close Lose builds):');
console.log('  level   deckN   deck length   radix   slack');
RES.radixNote.forEach(r=>{
  console.log('  '+r.level.padEnd(8)+String(r.deckN).padStart(5)+
    String(r.deckLen).padStart(14)+String(r.radix).padStart(8)+String(r.slack).padStart(8));
});
console.log('');
