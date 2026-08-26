// REGRESSION + TARGET ACCURACY
//
// Recovered from tools/reg.js at v1.0.1, deleted in 1.0.2. It builds every level against every
// outcome and plays each one many times.
//
// Three nested measures, widest first. Each is a subset of the one above it:
//
//   INTENT MATCH      did the run end win or lose as intended? Purely the outcome type.
//   IN TARGET RANGE   intent matched AND the margin fell inside the authored range.
//   EXACT TARGET      intent matched AND it landed on the precise number.
//
// A VERIFIED level is promised Exact Target on every run - a proof is a proof. A LIVE level
// is promised In Target Range only: it corrects as you play, so the honest commitment is a
// range rather than a number. Nothing else measures the live side, which is why this was
// worth bringing back.
//
// A miss is reported as EASIER or HARDER than intended rather than above or below the
// range, because above and below mean opposite things on the two sides. More draws unused
// on a win and fewer cards stranded on a lose are both the level being easier than it was
// meant to be. One vocabulary, and it says which way to fix it.
//
// Four things were fixed on the way back in, and each of them would have made the numbers
// wrong rather than merely noisy:
//
//   1. CRLF. Every harness in the old tools/ matched /<script>\n"use strict";/ and this clone
//      checks out CRLF, so the match returned null and the script died at line 3 before running
//      a single case. An early exit is not a pass.
//   2. Stale target. It compared against lv.tv captured at BUILD time, but the recovery ladder
//      moves LV.tv during play - that is the documented behaviour class, not a defect. It now
//      compares against the target as it stands at the END of the run, and reports separately
//      how often the target moved.
//   3. No policies. It only ever played one way, and accuracy for a player who never wastes
//      a move is not accuracy.
//   4. It scored a verified level as merely in-range whenever the deck had moved. That hid
//      exactly the failures it existed to find; with the target read correctly, Exact Target
//      is the right bar.
//
// READ THE LIVE NUMBER AS A RANGE, NOT A POINT.
//
// Three runs of IDENTICAL code at 50 runs per build gave 497, 480 and 483 of 550 - 90.4%,
// 87.3%, 87.8%. That spread is the harness, not the director. Level generation is time-boxed,
// so under different machine load the generator gets through a different number of candidate
// deals inside its budget, a different deal wins, and all 30 builds differ. equiv.js said as
// much in its own header - the generator around the provers can never be deterministic.
//
// So: quote the live figure as roughly 88 +/- 3, and never claim a 1-3 point improvement from
// this script alone. For an A/B, build ONCE and replay - a single fixed build is byte-for-byte
// reproducible, which is what makes a targeted probe trustworthy where this is not.
//
// VERIFIED is immune: exact-on-every-run cannot drift, and it has read 950/950 every time.
//
// Run: node docs/measurements/reg.js [policy|all] [runsPerBuild]
const fs=require('fs'),vm=require('vm'),path=require('path');
const ARGPOL=process.argv[2]||'random';
const RUNS=+(process.argv[3]||10);
// AED_SRC points the harness at a different build, so an A/B needs no edit to the working
// tree - which is itself a source of error when the thing being measured is the tree.
const SRC=process.env.AED_SRC||path.join(__dirname,'..','..','index.html');
const src=fs.readFileSync(SRC,'utf8');
function ctx(source){
  const m=source.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);   // fix 1
  if(!m)throw new Error('script block not found - CRLF? An early exit is not a pass.');
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
S.RUNS=RUNS;S.ARGPOL=ARGPOL;
vm.runInContext(`
POLS=(ARGPOL==='all')?BOTPOL.slice():[ARGPOL];
ROWS=[];BUGS=[];
// One build per level+outcome, played by every policy. Rebuilding per policy would compare
// policies on different deals, which is not a comparison.
for(let li=0;li<LEVELS.length;li++){
 for(let ti=0;ti<OUT.length;ti++){
  let lv=null;
  try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }
  catch(e){ BUGS.push(LEVELS[li].short+' build threw: '+e.message); continue; }
  if(!lv)continue;
  const live=(lv.usedMode===4), bd=[OUT[ti].lo,OUT[ti].hi], buildTv=lv.tv;
  for(const pol of POLS){
    const row={pol:pol,lvl:LEVELS[li].short,out:OUT[ti].n,live:live,band:bd,tv:buildTv,
               runs:0,side:0,exact:0,inband:0,easier:0,harder:0,moved:0,bugs:[]};
    for(let p=0;p<RUNS;p++){
      let o=null;
      try{ o=botPlay(seedFor(LEVELS[li].short,ti)+7919*(p+1),pol); }
      catch(e){ row.bugs.push('play threw: '+e.message); break; }
      for(const b of o.bugs)if(row.bugs.indexOf(b)<0)row.bugs.push(b);
      if(!o.res)continue;
      row.runs++;
      const tvEnd=LV.tv;                       // fix 2: the target as it stands NOW
      if(tvEnd!==buildTv)row.moved++;
      if(o.res.win===OUT[ti].win){row.side++;
        if(o.res.v===tvEnd)row.exact++;
        if(o.res.v>=bd[0]&&o.res.v<=bd[1])row.inband++;
        else if(OUT[ti].win?(o.res.v>bd[1]):(o.res.v<bd[0]))row.easier++;
        else row.harder++;}
    }
    ROWS.push(row);
  }
 }
}
// Undo through a rescue must restore the board exactly. Kept from the original.
UNDO={n:0,bad:0};
for(let li=0;li<LEVELS.length;li++){
  let lv=null;
  try{ lv=buildFixed(li,4,seedFor(LEVELS[li].short,4)); }catch(e){ continue; }
  if(!lv)continue;
  srand(99+li);SILENT=true;skipToEnd();SILENT=false;
  if(N-cl.size===0)continue;
  SILENT=true;ecStart(5,'coins');SILENT=false;
  const before={left:N-cl.size,runs:ECRUNS,phase:PHASE};
  SILENT=true;
  for(let s2=0;s2<4;s2++){const lg=legals();if(lg.length)play(lg[0]);else if(deckLeft()>0)draw();else break;}
  for(let s2=0;s2<4;s2++)back();
  SILENT=false;
  UNDO.n++;
  if(N-cl.size!==before.left||ECRUNS!==before.runs||PHASE!==before.phase)UNDO.bad++;
}`,S);

const rows=S.ROWS, pols=[...new Set(rows.map(r=>r.pol))];
console.log('');
console.log('  REGRESSION + TARGET ACCURACY   -   '+RUNS+' runs per build');
console.log('');
for(const pol of pols){
  const rs=rows.filter(r=>r.pol===pol);
  const ver=rs.filter(r=>!r.live), live=rs.filter(r=>r.live);
  const vRuns=ver.reduce((a,r)=>a+r.runs,0), vEx=ver.reduce((a,r)=>a+r.exact,0);
  const lRuns=live.reduce((a,r)=>a+r.runs,0), lIn=live.reduce((a,r)=>a+r.inband,0);
  const lSide=live.reduce((a,r)=>a+r.side,0);
  const vFail=ver.filter(r=>r.exact<r.runs);
  console.log('  policy '+pol);
  console.log('    VERIFIED  exact target '+vEx+'/'+vRuns+'  ('+(100*vEx/vRuns).toFixed(1)+'%)   '+
    (vFail.length?vFail.length+' build(s) missed':'every build held')+
    (pol==='random'&&vFail.length?'   <- a random-policy miss is a REAL failure':''));
  const lEasy=live.reduce((a,r)=>a+r.easier,0), lHard=live.reduce((a,r)=>a+r.harder,0);
  console.log('    LIVE      in target range '+lIn+'/'+lRuns+'  ('+(100*lIn/lRuns).toFixed(1)+
    '%)   intent match '+lSide+'/'+lRuns+'  ('+(100*lSide/lRuns).toFixed(1)+'%)');
  console.log('              of the misses: '+lEasy+' easier than intended, '+lHard+' harder');
  const worst=live.slice().sort((a,b)=>(a.inband/Math.max(1,a.runs))-(b.inband/Math.max(1,b.runs))).slice(0,4);
  console.log('    weakest live builds: '+worst.map(r=>r.lvl+'/'+r.out.replace(/ .*/,'')+' '+
    r.inband+'/'+r.runs+(r.easier>r.harder?' (easier)':r.harder>r.easier?' (harder)':'')).join('   '));
  console.log('');
}
console.log('  Per-build detail, policy '+pols[0]);
console.log('');
console.log('  level  outcome              director  range   intent   in range   exact  easier harder  moved');
console.log('  '+'-'.repeat(92));
for(const r of rows.filter(x=>x.pol===pols[0])){
  console.log('  '+r.lvl.padEnd(7)+r.out.padEnd(21)+(r.live?'live':'verified').padEnd(10)+
    (r.band[0]+'-'+r.band[1]).padEnd(7)+
    (r.side+'/'+r.runs).padStart(7)+(r.inband+'/'+r.runs).padStart(11)+
    (r.exact+'/'+r.runs).padStart(8)+String(r.easier).padStart(7)+String(r.harder).padStart(7)+
    String(r.moved).padStart(7)+
    (r.bugs.length?'   '+r.bugs.join(' | '):''));
}
console.log('');
console.log('  UNDO THROUGH A RESCUE: '+(S.UNDO.n-S.UNDO.bad)+'/'+S.UNDO.n+' restored exactly');
if(S.BUGS.length)console.log('  BUILD ISSUES: '+S.BUGS.join(' | '));
console.log('');
console.log('  intent    = ended win or lose as intended.  in range = intent AND margin inside');
console.log('              the target range.  exact = intent AND the precise number.');
console.log('  easier    = the level gave more than intended (more draws unused on a win, fewer');
console.log('              cards stranded on a lose).  harder = the reverse.');
console.log('  moved     = runs where the ladder retargeted mid-level. Documented behaviour.');
console.log('');
console.log('  A verified build is promised EXACT TARGET, and on the random policy only - the');
console.log('  guarantee is known not to survive a voluntary draw (ISSUE-015). A live build is');
console.log('  promised IN TARGET RANGE, and nothing but this measures whether it delivers.');
console.log('');
