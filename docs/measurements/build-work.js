// What does a build actually COST, in states explored?
//
// ISSUE-004: searchPass is bounded by wall clock, so a fast machine buys more attempts than a
// slow one and buildFixed(li,ti,seed) is not reproducible. Measured today, one L7 build read
// 40, 31, 31, 40 in range across runs of functionally identical code - a nine-run swing caused
// entirely by which deal the clock happened to land on.
//
// The fix is a work budget. The first attempt at it counted exh() CALLS and was parked as
// "right in principle, wrong in calibration". Calls are the wrong unit: cost varies by three
// orders of magnitude between a quick proof and a capped failure. This measures the right unit
// - states - so the budget can be sized from evidence.
//
// Run: node docs/measurements/build-work.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
function ctx(source){
  const m=source.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);
  if(!m)throw new Error('script block not found (CRLF?)');
  let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
  const ids=[...new Set([...source.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
  const store={};
  const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',style:{},value:'0',
    dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},appendChild(){},
    setAttribute(){},classList:{toggle(){},add(){},remove(){}},set disabled(v){},
    get disabled(){return false;},click(){},files:[],querySelector:()=>null,
    closest:()=>null,hidden:false,scrollIntoView(){},type:'',title:''});
  ids.forEach(id=>store[id]=mk(id));
  const fb={set disabled(v){},get disabled(){return false;}};
  const s={document:{getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
      querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
      body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}},
    window:{addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},
    console:console,setTimeout:()=>0,clearTimeout:()=>{},requestAnimationFrame:()=>0,
    Date:Date,Math:Math,JSON:JSON,parseInt:parseInt,parseFloat:parseFloat,isFinite:isFinite,
    Number:Number,String:String,Array:Array,Object:Object,Set:Set,Map:Map,Error:Error};
  s.globalThis=s;
  vm.createContext(s);vm.runInContext(js,s);return s;
}
const S=ctx(src);
vm.runInContext(`
ROWS=[];
for(let li=0;li<LEVELS.length;li++){
  for(let ti=0;ti<OUT.length;ti++){
    WORK=0;GENC=0;
    const t0=Date.now();
    let lv=null;
    try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){}
    ROWS.push({lvl:LEVELS[li].short,out:OUT[ti].n,ms:Date.now()-t0,work:WORK,gen:GENC,
               ver:!!(lv&&lv.deck&&lv.deck.length),obs:obsPresent().join('+')||'none'});
  }
}`,S);

const rows=S.ROWS;
console.log('');
console.log('  Cost of one build, and whether the prover won it');
console.log('');
console.log('  level  outcome              obstacles   director     states    genAttempts        ms');
console.log('  '+'-'.repeat(88));
for(const r of rows)
  console.log('  '+r.lvl.padEnd(7)+r.out.padEnd(21)+r.obs.padEnd(12)+
    (r.ver?'verified':'live').padEnd(11)+String(r.work).padStart(10)+String(r.gen).padStart(15)+String(r.ms).padStart(10));
// No cost model, deliberately. A least-squares fit of ms against both counters returns a
// NEGATIVE weight for states, because the two are collinear across these builds - which means
// the data cannot separate them and any single combined unit would be invented, not measured.
// Two independent caps need no weighting: stop when EITHER is spent.
const ws=rows.map(r=>r.work).sort((a,b)=>a-b);
const gs=rows.map(r=>r.gen).sort((a,b)=>a-b);
const ms=rows.map(r=>r.ms).sort((a,b)=>a-b);
const pct=(a,p)=>a[Math.min(a.length-1,Math.floor(a.length*p))];
const tot=ws.reduce((a,b)=>a+b,0), totMs=ms.reduce((a,b)=>a+b,0);
console.log('');
console.log('  states per build      median '+pct(ws,0.5).toLocaleString()+
            '   90th '+pct(ws,0.9).toLocaleString()+'   max '+ws[ws.length-1].toLocaleString());
console.log('  genAttempts per build median '+pct(gs,0.5).toLocaleString()+'   90th '+pct(gs,0.9).toLocaleString()+'   max '+gs[gs.length-1].toLocaleString());
console.log('  ms per build          median '+pct(ms,0.5)+'   90th '+pct(ms,0.9)+'   max '+ms[ms.length-1]);
const vw=rows.filter(r=>r.ver);
console.log('');
console.log('  WORST VERIFIED build: '+Math.max.apply(null,vw.map(r=>r.work)).toLocaleString()+' states, '+Math.max.apply(null,vw.map(r=>r.gen)).toLocaleString()+' genAttempts.');
console.log('  Any cap must clear those or coverage is lost.');
console.log('  whole set: '+tot.toLocaleString()+' states in '+totMs+' ms');
console.log('');
console.log('  A LIVE row is a build the prover lost, and those are the expensive ones - all the');
console.log('  time goes into failures, which is exactly what the parked attempt mis-sized. Size');
console.log('  the per-value budget so the worst VERIFIED build still fits, and a hopeless one');
console.log('  gives up at a predictable cost instead of at whatever the clock allowed.');
console.log('');
