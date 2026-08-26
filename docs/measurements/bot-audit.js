// Is the bot good enough to measure anything with?
//
// It has been wrong twice already. It reported four false failures on L7 because it could not
// collect a lock/key pair - a legal move it had no code for. And every repeated run inherited
// the previous one's mutated level, because reset() was not restoring tv/band/deckLen. A
// harness that cannot make a move, or that changes the level between runs, does not measure
// the game - it measures itself.
//
// So before trusting it with band accuracy, check three things across every POLICY:
//
//   COVERAGE    which of the player's actions does it ever take?
//   INTENT      does it land on the outcome the level is aiming at?
//   INVARIANTS  does anything it does break a rule of the game?
//
// Run: node docs/measurements/bot-audit.js [runsPerBuild]
const fs=require('fs'),vm=require('vm'),path=require('path');
const RUNS=+(process.argv[2]||12);
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
S.RUNS=RUNS;
vm.runInContext(`
ACT={play:0,draw:0,lkTap:0,useWild:0,miss1:0,back:0};
(function(){
  const w=(n,f)=>function(){ACT[n]++;return f.apply(null,arguments);};
  play=w('play',play); draw=w('draw',draw); lkTap=w('lkTap',lkTap);
  useWild=w('useWild',useWild); miss1=w('miss1',miss1); back=w('back',back);
})();
ROWS=[];PACT={};
for(const pol of BOTPOL)PACT[pol]={play:0,draw:0,lkTap:0,useWild:0,miss1:0,back:0};
// Build ONCE per level+outcome and run every policy against that same deal. Rebuilding per
// policy cost six times the builds - the generator is time-boxed, so that was the whole
// runtime - and it also compared policies on DIFFERENT deals, which is not a comparison.
for(let li=0;li<LEVELS.length;li++){
  for(let ti=0;ti<OUT.length;ti++){
    let lv=null;
    try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){ continue; }
    if(!lv)continue;
    const isVer=!!(lv.deck&&lv.deck.length), want=lv.tgt.win;
    for(const pol of BOTPOL){
      const mark=Object.assign({},ACT);
      const row={pol:pol,lvl:LEVELS[li].short,out:OUT[ti].n,
                 dir:isVer?"verified":"live",want:want,
                 runs:0,side:0,exact:0,bugs:[],inv:[]};
      for(let p=0;p<RUNS;p++){
        let o=null;
        try{ o=botPlay(seedFor(LEVELS[li].short,ti)+7919*(p+1),pol); }
        catch(e){ row.bugs.push("threw: "+e.message); break; }
        for(const bb of o.bugs)if(row.bugs.indexOf(bb)<0)row.bugs.push(bb);
        if(!o.res){row.bugs.push("did not finish");continue;}
        row.runs++;
        if(o.res.win===row.want){row.side++; if(o.res.v===LV.tv)row.exact++;}
        if(di>dk.length)row.inv.push("draw index past the end of the deck");
        if(cl.size>N)row.inv.push("more cards cleared than the level has");
        if(o.res.win&&N-cl.size!==0)row.inv.push("won with cards still on the board");
        if(!o.res.win&&legals().length)row.inv.push("lost with a legal move available");
        if(!o.res.win&&lkReady())row.inv.push("lost with a pair ready to collect");
        if(deckLeft()<0)row.inv.push("deck left went negative");
      }
      ROWS.push(row);
      for(const k in ACT)PACT[pol][k]+=ACT[k]-mark[k];
    }
  }
}
TOTAL=ACT;`,S);

const A=['play','draw','lkTap','useWild','miss1','back'];
const pols=[...new Set(S.ROWS.map(r=>r.pol))];
console.log('');
console.log('  BOT AUDIT  -  '+RUNS+' runs per build, every policy');
console.log('');
console.log('  policy       runs   intent match        exact target      issues');
console.log('  '+'-'.repeat(78));
for(const pol of pols){
  const rs=S.ROWS.filter(r=>r.pol===pol);
  const runs=rs.reduce((a,r)=>a+r.runs,0), side=rs.reduce((a,r)=>a+r.side,0);
  const vr=rs.filter(r=>r.dir==='verified');
  const vRuns=vr.reduce((a,r)=>a+r.runs,0), vEx=vr.reduce((a,r)=>a+r.exact,0);
  const iss=[...new Set([].concat.apply([],rs.map(r=>[].concat(r.bugs,r.inv))))];
  console.log('  '+pol.padEnd(13)+String(runs).padStart(4)+
    ('   '+side+'/'+runs+' ('+(100*side/runs).toFixed(1)+'%)').padEnd(21)+
    (vEx+'/'+vRuns+' ('+(100*vEx/vRuns).toFixed(1)+'%)').padEnd(18)+
    (iss.length?iss.join(' | '):'none'));
}
console.log('');
console.log('  ACTION COVERAGE  -  which policy exercises what');
console.log('  '+'-'.repeat(78));
console.log('  policy       '+A.map(k=>k.padStart(9)).join(''));
for(const pol of pols)
  console.log('  '+pol.padEnd(13)+A.map(k=>String(S.PACT[pol][k]||0).padStart(9)).join(''));
console.log('  '+'TOTAL'.padEnd(13)+A.map(k=>String(S.TOTAL[k]||0).padStart(9)).join(''));
const never=A.filter(k=>!(S.TOTAL[k]>0));
console.log('');
console.log(never.length
  ? '  NEVER TAKEN: '+never.join(', ')+'\n'+
    '  Every number this harness produces carries that as a caveat.'
  : '  Every player action is exercised. The bot can do what a player can do.');
console.log('');
console.log('  "exact target" is the share of runs on a VERIFIED build that landed on the');
console.log('  target as it stood at the end of the run. Only `random` is promised that: the');
console.log('  verified guarantee is known not to survive a voluntary draw (ISSUE-015), so a');
console.log('  drawhappy or messy figure below 100% is documented behaviour, not a new defect.');
console.log('  A `random` figure below 100% would be a real failure.');
console.log('');
