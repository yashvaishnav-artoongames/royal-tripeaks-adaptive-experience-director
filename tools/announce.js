const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',style:{},value:'0',
  dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},appendChild(){},
  setAttribute(){},classList:{toggle(){},add(){},remove(){}},set disabled(v){},
  get disabled(){return false;},click(){},files:[]});
ids.forEach(id=>store[id]=mk(id));
const fb={set disabled(v){},get disabled(){return false;}};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
  querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
  body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}};
global.window={addEventListener(){}};global.localStorage={getItem(){return null;},setItem(){}};
global.setTimeout=()=>0;
eval(js + `
// play real streaks through play() and capture what the player is told
const seen=[];
for(const cfg of [['Coins',100],['ExtraCards',1],['WildCard',1]]){
  STREAK_REWARD.type=cfg[0];STREAK_REWARD.amount=cfg[1];
  for(let li=0;li<LEVELS.length&&seen.filter(function(s){return s.type===cfg[0];}).length<2;li++){
    for(const ti of [3,4]){
      const lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti));
      if(!lv)continue;
      srand(77+li);
      for(let s=0;s<400;s++){
        if(N-cl.size===0)break;
        const before=STREAK_LOG.length;
        const lg=legals();
        if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
        else if(deckLeft()>0)draw();
        else break;
        if(STREAK_LOG.length>before){
          seen.push({type:cfg[0],level:LEVELS[li].short,note:String(note),
                     beat:String(beat),
                     same:STREAK_LOG[STREAK_LOG.length-1].sameColor});
          break;
        }
      }
    }
  }
}
OUTP=seen;
`);
console.log('');
console.log('  WHAT THE PLAYER IS TOLD WHEN A STREAK COMPLETES');
console.log('');
const seen = OUTP || [];
if(!seen.length){ console.log('  no streak completed in the sample'); }
seen.slice(0,8).forEach(s=>{
  console.log('  ['+s.type+'] '+s.level+(s.same?'  SAME COLOUR':''));
  console.log('     beat: '+s.beat);
  console.log('     note: '+s.note.replace(/<[^>]+>/g,''));
  console.log('');
});
const good = seen.length && seen.every(s=>/streak complete/i.test(s.note));
console.log('  '+(good?'PASS':'GAP ')+'  every completion is announced in the play log');
console.log('');
