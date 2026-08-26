// Is the bot good enough to measure anything with?
//
// It already reported four false failures on L7 because it could not collect a lock/key pair -
// a legal move it simply had no code for. A harness that cannot make a move does not measure
// the game, it measures itself. So before trusting it with band accuracy, check three things:
//
//   COVERAGE    which of the player's actions does it ever take?
//   SPREAD      does it reach both wins and losses, or only ever one?
//   INVARIANTS  does anything it does break a rule of the game?
//
// Run: node docs/measurements/bot-audit.js [runsPerBuild]
const fs=require('fs'),vm=require('vm'),path=require('path');
const RUNS=+(process.argv[2]||20);
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
// Count every player action the bot takes, by wrapping the real ones.
ACT={play:0,draw:0,lkTap:0,useWild:0,miss1:0,back:0};
(function(){
  const w=(n,f)=>function(){ACT[n]++;return f.apply(null,arguments);};
  play=w('play',play); draw=w('draw',draw); lkTap=w('lkTap',lkTap);
  useWild=w('useWild',useWild); miss1=w('miss1',miss1); back=w('back',back);
})();
ROWS=[];
for(let li=0;li<LEVELS.length;li++){
  for(let ti=0;ti<OUT.length;ti++){
    let lv=null;
    try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){ continue; }
    if(!lv)continue;
    const before=Object.assign({},ACT);
    const row={lvl:LEVELS[li].short,out:OUT[ti].n,
               dir:(lv.deck&&lv.deck.length)?'verified':'live',wantWin:lv.tgt.win,side:0,
               wins:0,losses:0,noRes:0,bugs:[],inv:[]};
    for(let p=0;p<RUNS;p++){
      let o=null;
      try{ o=botPlay(seedFor(LEVELS[li].short,ti)+7919*(p+1)); }
      catch(e){ row.bugs.push('threw: '+e.message); break; }
      for(const b of o.bugs)if(row.bugs.indexOf(b)<0)row.bugs.push(b);
      if(!o.res){row.noRes++;continue;}
      if(o.res.win)row.wins++;else row.losses++;
      if(o.res.win===row.wantWin)row.side++;
      // Invariants checked from OUTSIDE botPlay, on the state it left behind.
      if(di>dk.length)row.inv.push('draw index past the end of the deck');
      if(cl.size>N)row.inv.push('more cards cleared than the level has');
      if(o.res.win&&N-cl.size!==0)row.inv.push('reported a win with cards still on the board');
      if(!o.res.win&&legals().length)row.inv.push('reported a loss with a legal move available');
      if(!o.res.win&&lkReady())row.inv.push('reported a loss with a pair ready to collect');
      if(deckLeft()<0)row.inv.push('deck left went negative');
      for(let z=0;z<N;z++)if(cl.has(z)&&isPlusCard(z)===false&&LV.rank[z]===undefined&&!isWildSlot(z)&&!isLKSlot(z))
        row.inv.push('cleared a slot that never got a rank');
    }
    row.acts={};
    for(const k in ACT)row.acts[k]=ACT[k]-before[k];
    ROWS.push(row);
  }
}
TOTAL=ACT;`,S);

const A=['play','draw','lkTap','useWild','miss1','back'];
console.log('');
console.log('  BOT AUDIT  -  '+RUNS+' runs per build');
console.log('');
console.log('  level  outcome              director   wins  losses   side   issues');
console.log('  '+'-'.repeat(74));
let bad=0;
for(const r of S.ROWS){
  const iss=[].concat(r.bugs,r.inv).filter((v,i,a)=>a.indexOf(v)===i);
  if(iss.length)bad++;
  console.log('  '+r.lvl.padEnd(7)+r.out.padEnd(21)+r.dir.padEnd(11)+
    String(r.wins).padStart(5)+String(r.losses).padStart(8)+(r.side+'/'+(r.wins+r.losses)).padStart(8)+'   '+(iss.length?iss.join(' | '):'none'));
}
console.log('');
console.log('  ACTION COVERAGE across every run');
console.log('  '+'-'.repeat(50));
for(const k of A){
  const n=S.TOTAL[k]||0;
  console.log('  '+k.padEnd(10)+String(n).padStart(8)+'   '+(n>0?'exercised':'NEVER TAKEN'));
}
const never=A.filter(k=>!(S.TOTAL[k]>0));
console.log('');
console.log('  '+(S.ROWS.length-bad)+' of '+S.ROWS.length+' builds raised no issue.');
console.log('');
if(never.length)
  console.log('  '+never.length+' player action(s) NEVER TAKEN: '+never.join(', ')+'\n'+
              '  Whatever those paths do to a target, this bot cannot see it. That is a limit on\n'+
              '  every number it produces, not a defect in the game.');
else console.log('  Every player action was exercised at least once.');
console.log('');
// Landing on the target's SIDE every time is the director succeeding, not the bot failing to
// explore. Only a run on the WRONG side is a miss, and that is what to count.
let sideOK=0,sideRun=0,offSide=[];
for(const r of S.ROWS){sideOK+=r.side;sideRun+=r.wins+r.losses;
  if(r.side<r.wins+r.losses)offSide.push(r.lvl+'/'+r.out+' '+r.side+'/'+(r.wins+r.losses));}
console.log('  SIDE ACCURACY  '+sideOK+'/'+sideRun+'  ('+(100*sideOK/sideRun).toFixed(1)+'%) landed on the outcome the level was aiming at.');
console.log('  This is the side only - win vs lose. Whether the NUMBER lands in band is a');
console.log('  separate question and nothing here measures it yet.');
if(offSide.length){console.log('');console.log('  Builds that missed the side:');
  for(const o of offSide)console.log('    '+o);}
console.log('');
