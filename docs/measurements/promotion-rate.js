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
ROWS=[];TRIES=[];PMAX=PLANB.promoMax;PTRIES=PLANB.promoTries;
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
    // COST vs VALUE, one entry per attempt. u is what was still undecided; cl and dr are how
    // far through the level it was. The gate reads u only.
    for(const t of PLANC.tries)TRIES.push({lvl:LEVELS[li].short,out:OUT[ti].n,
      u:t.u,cl:t.cl,dr:t.dr,ok:t.ok});
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

// ---- the question this probe exists to answer -------------------------------
// The gate fires when a proof is AFFORDABLE. Affordability rises as the level empties, so it
// fires as late as it can - which is also when a guarantee is worth least. If every proof
// lands past ~85% cleared, promotion is not mistuned, it is structurally pointless, and that
// matters far more than any tuning number.
const T=S.TRIES||[];
const q=function(a,f){const v=a.map(f).sort(function(x,y){return x-y;});
  if(!v.length)return null;
  return {min:v[0],med:v[Math.floor(v.length/2)],max:v[v.length-1]};};
const pc=function(o){return o?(Math.round(o.min*100)+"% / "+Math.round(o.med*100)+"% / "+
  Math.round(o.max*100)+"%"):"-";};
const nn=function(o){return o?(o.min+" / "+o.med+" / "+o.max):"-";};
const okT=T.filter(function(t){return t.ok;}), noT=T.filter(function(t){return !t.ok;});
console.log("");
console.log("  COST vs VALUE   -   min / median / max across "+T.length+" attempts");
console.log("  "+"-".repeat(76));
console.log("                       undecided cards     board cleared        deck used");
console.log("  proved   ("+String(okT.length).padStart(3)+")   "+
  nn(q(okT,function(t){return t.u;})).padEnd(20)+
  pc(q(okT,function(t){return t.cl;})).padEnd(21)+pc(q(okT,function(t){return t.dr;})));
console.log("  failed   ("+String(noT.length).padStart(3)+")   "+
  nn(q(noT,function(t){return t.u;})).padEnd(20)+
  pc(q(noT,function(t){return t.cl;})).padEnd(21)+pc(q(noT,function(t){return t.dr;})));
console.log("  "+"-".repeat(76));
if(okT.length){
  const cls=okT.map(function(t){return t.cl;}).sort(function(a,b){return a-b;});
  const earliest=Math.round(cls[0]*100);
  const typical=Math.round(cls[Math.floor(cls.length/2)]*100);
  console.log("  Earliest a proof ever landed: "+earliest+"% of the board cleared. Typical: "+
    typical+"%.");
  if(earliest>=85){
    console.log("  >> EVERY proof lands after 85%. Affordable and worthwhile DO NOT OVERLAP,");
    console.log("     so a promoLatest bound would close promotion entirely. That is a");
    console.log("     finding about the design, not a tuning problem.");
  }else{
    console.log("  >> Proofs land while there is still level left. A promoLatest above "+typical+
      "% keeps");
    console.log("     them and drops only the ones that guarantee almost nothing.");
  }
}else if(T.length){
  console.log("  Nothing proved, so there is no value window to measure yet.");
}
console.log('');
console.log('  A refusal is not a failure. wild and up/down are structurally unprovable, so');
console.log('  those rows are EXPECTED to refuse - see docs/specs/predictive_planning_plan.md 5.4,');
console.log('  which predicted L7 converts and L21 and L41 do not.');
console.log('');
