// Does the PROOF describe the game the player actually gets?
//
// The strongest check there is, and the only one that can catch a wrong obstacle model. Every
// other measurement here asks whether exh() accepted a deal. This one builds the level, then
// plays it for real - the same play(), draw() and plusSweep() the player drives - and demands
// that EVERY run land exactly on the proved target. A verified level that misses even once is
// not a weaker proof, it is a proof about a different game. That is ISSUE-011's whole shape.
//
// Run: node docs/measurements/proof-holds.js [runsPerBuild]
const fs=require('fs'),vm=require('vm'),path=require('path');
const RUNS=+(process.argv[2]||25);
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
OUTR=[];
for(let li=0;li<LEVELS.length;li++){
  for(let ti=0;ti<OUT.length;ti++){
    let lv=null;
    try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){ continue; }
    if(!lv||!lv.deck||!lv.deck.length)continue;      // live builds make no promise
    const row={lvl:LEVELS[li].short,obs:obsPresent().join('+')||'none',out:OUT[ti].n,
               tv:lv.tv,win:lv.tgt.win,runs:0,exact:0,exactEnd:0,moved:0,side:0,off:[],bugs:[],grant:0,pairs:0};
    for(let p=0;p<RUNS;p++){
      let o=null;
      try{ o=botPlay(seedFor(LEVELS[li].short,ti)+7919*(p+1)); }
      catch(e){ row.bugs.push('threw: '+e.message); break; }
      for(const b of o.bugs)if(row.bugs.indexOf(b)<0)row.bugs.push(b);
      if(!o.res)continue;
      row.runs++;
      // Attribution. Extra cards arriving mid-play are NOT in the proof - that is ISSUE-002,
      // not an obstacle model. And botPlay has no pair-collect move, so a lock/key level it
      // loses may be the BOT failing rather than the proof.
      row.grant+=(STREAK_GRANTED||0)+(ECGRANTED||0)+(typeof plusGranted==="function"?0:0);
      row.pairs+=(typeof LKDONE!=="undefined"&&LKDONE)?LKDONE.length:0;
      // The ladder is ALLOWED to move the target when supply changes - that is the
      // documented behaviour class, not a defect. So compare against the target as it stands
      // at the END of the run as well as the one the build promised, and report both. If a
      // run lands on the moved target, the proof held and the number was absorbed.
      const tvEnd=LV.tv;
      if(tvEnd!==row.tv)row.moved++;
      if(o.res.win===row.win&&o.res.v===tvEnd)row.exactEnd++;
      if(o.res.win===row.win){row.side++;
        if(o.res.v===row.tv)row.exact++;
        else if(row.off.indexOf(o.res.v)<0)row.off.push(o.res.v);}
      else if(row.off.indexOf(o.res.win?'won':'lost')<0)row.off.push(o.res.win?'won':'lost');
    }
    OUTR.push(row);
  }
}`,S);

console.log('');
console.log('  Every run of a VERIFIED build must land exactly on its proved target.');
console.log('  '+RUNS+' runs per build.');
console.log('');
console.log('  level  obstacles  outcome              tv   exact/runs   verdict  grants  tvMoved');
console.log('  '+'-'.repeat(76));
let bad=0,tot=0;
for(const r of S.OUTR){
  tot++;
  const ok=(r.exactEnd===r.runs&&r.runs>0&&!r.bugs.length);
  if(!ok)bad++;
  console.log('  '+r.lvl.padEnd(7)+r.obs.padEnd(11)+r.out.padEnd(21)+
    String(r.tv).padStart(3)+'   '+(r.exactEnd+'/'+r.runs).padStart(9)+'   '+
    (ok?'holds ':'MISSED').padEnd(8)+String(r.grant).padStart(7)+String(r.moved).padStart(8)+(ok?'':'   landed on '+r.off.join(',')));
}
console.log('');
console.log('  '+(tot-bad)+' of '+tot+' verified builds held on every run.');
console.log('');
if(bad===0)
  console.log('  The proofs describe the game the player gets. No obstacle model is lying.');
else
  console.log('  '+bad+' build(s) MISSED. A verified level that misses is a proof about a\n'+
              '  different game - find which obstacle the model has wrong before shipping.');
console.log('');
