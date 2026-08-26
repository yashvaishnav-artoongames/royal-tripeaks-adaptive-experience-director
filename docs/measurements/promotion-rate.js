// Does mid-level promotion ever actually fire, and if not, why not?
//
// Stage 3 lets a LIVE build mint its unseen region, prove the target from where the player
// actually is, and stop being live. reg.js cannot answer whether it fired: on the random
// policy the live director already reads 550/550, so a promotion that never happens and one
// that happens every round produce the same number.
//
// This reads PLANC - the planning counters - and, for every live build that was never
// eligible, says which clause refused it. A stage that fires zero times is a stage that was
// not built, however well it parses.
//
// Run: node docs/measurements/promotion-rate.js [policy] [runsPerBuild]
const fs=require('fs'),vm=require('vm'),path=require('path');
const ARGPOL=process.argv[2]||'random';
const RUNS=+(process.argv[3]||10);
const SRC=process.env.AED_SRC||path.join(__dirname,'..','..','index.html');
const src=fs.readFileSync(SRC,'utf8');

function ctx(source){
  const m=source.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);
  if(!m)throw new Error('script block not found - CRLF? An early exit is not a pass.');
  const js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
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
S.RUNS=RUNS;S.ARGPOL=ARGPOL;

vm.runInContext(`
ROWS=[];PMAX=PLANB.promoMax;PTRIES=PLANB.promoTries;
for(let li=0;li<LEVELS.length;li++){
 for(let ti=0;ti<OUT.length;ti++){
  let lv=null;
  try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){ continue; }
  if(!lv)continue;
  if(lv.usedMode!==4)continue;                 // only LIVE builds can be promoted
  const row={lvl:LEVELS[li].short,out:OUT[ti].n,runs:0,
             attempt:0,promoted:0,intact:0,replanned:0,reshaped:0,gaveup:0,
             // why it was refused, sampled at the first move of every run
             noTaught:0,hadWild:0,tooBig:0,minUnknown:1e9,
             promoAt:[]};
  for(let p=0;p<RUNS;p++){
    let res=null;
    try{ res=botPlay(seedFor(LEVELS[li].short,ti)+p*7919,ARGPOL); }catch(e){ continue; }
    row.runs++;
    row.attempt+=PLANC.attempt; row.promoted+=PLANC.promoted;
    row.intact+=PLANC.intact;   row.replanned+=PLANC.replanned;
    row.reshaped+=PLANC.reshaped; row.gaveup+=PLANC.live;
    if(PLANC.promoted)row.promoAt.push(di);
  }
  // Refusal reasons, read from a FRESH round rather than an ended one: at the end of a run
  // the board is clear or dead and every predicate refuses for uninteresting reasons.
  try{
    reset();
    if(!proverTaught())row.noTaught=1;
    if((LV.wildAt&&LV.wildAt.length)||countWilds(dk))row.hadWild=1;
    const u=promoUnknowns();
    row.minUnknown=u;
    if(u>PLANB.promoMax)row.tooBig=1;
  }catch(e){}
  ROWS.push(row);
 }
}
`,S);

const R=S.ROWS;
console.log('');
console.log('  MID-LEVEL PROMOTION   -   policy '+ARGPOL+', '+RUNS+' runs per build');
console.log('  '+'-'.repeat(94));
console.log('  live build              runs  attempt  PROMOTED   refused because');
console.log('  '+'-'.repeat(94));
let tA=0,tP=0;
for(const r of R){
  tA+=r.attempt;tP+=r.promoted;
  const why=[];
  if(r.noTaught)why.push('an obstacle the prover cannot model');
  if(r.hadWild)why.push('a wild in the deck');
  if(r.tooBig)why.push('starts at '+r.minUnknown+' unknown, ceiling is '+S.PMAX);
  if(!why.length&&!r.attempt)why.push('eligible at level start, never attempted - CHECK THE TRIGGERS');
  if(!why.length&&r.attempt&&!r.promoted)why.push('attempted, no deal proved');
  console.log('  '+(r.lvl+'/'+r.out).padEnd(24)+String(r.runs).padStart(4)+
    String(r.attempt).padStart(9)+String(r.promoted).padStart(10)+'   '+(why[0]||''));
  for(let i=1;i<why.length;i++)console.log('  '+' '.repeat(47)+why[i]);
}
console.log('  '+'-'.repeat(94));
console.log('  totals: '+tA+' attempts, '+tP+' promotions across '+R.length+' live builds');
if(!R.length)console.log('  NO LIVE BUILDS. Nothing to promote, and nothing measured.');
else if(!tA)console.log('  ZERO ATTEMPTS. Either every build is refused for a stated reason above,');
else if(!tP)console.log('  ZERO PROMOTIONS from '+tA+' attempts - the search never lands.');
else console.log('  Promotion fires. Depths reached: '+R.filter(r=>r.promoted)
  .map(r=>r.lvl+'/'+r.out+' at di '+r.promoAt.join(',')).join(' | '));
console.log('');
console.log('  A refusal is not a failure. wild and up/down are structurally unprovable, so');
console.log('  those rows are EXPECTED to refuse - see docs/specs/predictive_planning_plan.md 5.4,');
console.log('  which predicted L7 converts and L21 and L41 do not.');
console.log('');
