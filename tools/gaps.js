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
const T=[];
eval(js + `
function ok(n,c,d){T.push({n:n,p:!!c,d:d||''});}

// 1. "Draw anyway" onto a wild card
(function(){
  SILENT=true;
  buildFixed(1,4,seedFor(LEVELS[1].short,4));
  let good=false,detail='';
  for(let s=0;s<40&&!(legals().length&&deckLeft()>0);s++){
    const lg=legals();if(lg.length)play(lg[0]);else if(deckLeft()>0)draw();else break;}
  if(legals().length&&deckLeft()>0){
    dk.splice(di,0,['WILD','',false,false,true]);LV.deck=dk.slice();
    try{ miss1(); good=(wr===WILD_RANK); detail='waste rank after miss1 = '+JSON.stringify(wr); }
    catch(e){ detail='threw: '+e.message; }
  } else detail='could not reach a state with legals and deck';
  SILENT=false;
  ok('miss1 (Draw anyway) handles a wild card',good,detail);
})();

// 2. skipToEnd across a wild
(function(){
  SILENT=true;
  buildFixed(2,4,seedFor(LEVELS[2].short,4));
  let good=false,detail='';
  dk.splice(di+1,0,['WILD','',false,false,true]);LV.deck=dk.slice();
  try{ skipToEnd(); good=true; detail='reached '+(N-cl.size)+' cards left'; }
  catch(e){ detail='threw: '+e.message; }
  SILENT=false;
  ok('skipToEnd survives a wild in the deck',good,detail);
})();

// 3. live level: scheduled wild actually arrives
(function(){
  SILENT=true;
  let found=false,tested=false,detail='';
  for(let li=0;li<LEVELS.length&&!tested;li++){
    for(let ti=0;ti<OUT.length&&!tested;ti++){
      const lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti));
      if(!lv||lv.usedMode!==4)continue;
      tested=true;
      insertWild(1,'StreakReward');
      const sched=(LV.wildAt||[]).slice();
      for(let s=0;s<60;s++){
        if(N-cl.size===0)break;
        const lg=legals();
        if(lg.length)play(lg[0]);
        else if(deckLeft()>0){draw();if(wr===WILD_RANK){found=true;break;}}
        else break;
      }
      detail='scheduled at '+JSON.stringify(sched)+', wild reached: '+found;
    }
  }
  SILENT=false;
  ok('live level draws its scheduled wild',!tested||found,detail||'no live level built');
})();

// 4. wild on the waste is never left stranded on a non-scrolling board
(function(){
  SILENT=true;
  buildFixed(3,4,seedFor(LEVELS[3].short,4));
  let good=true,detail='';
  dk.splice(di,0,['WILD','',false,false,true]);LV.deck=dk.slice();
  draw();
  if(wr===WILD_RANK){
    const exposed=[];for(let i=0;i<N;i++)if(!cl.has(i)&&expo(i)&&onScreen(i))exposed.push(i);
    good=(legals().length===exposed.length);
    detail=legals().length+' legal of '+exposed.length+' exposed';
  } else { good=false; detail='wild did not land on the waste'; }
  SILENT=false;
  ok('wild waste makes every exposed card legal',good,detail);
})();

// 5. is streak telemetry exportable like ECED's?
ok('streak telemetry has a CSV export',typeof stkEventsCSV==='function',
   typeof stkEventsCSV==='function'?'':'STREAK_LOG exists in memory only');

// 6. player-facing reward announcement (spec §17)
(function(){
  SILENT=true;
  buildFixed(3,4,seedFor(LEVELS[3].short,4));
  STREAK_REWARD.type='ExtraCards';STREAK_REWARD.amount=1;
  stkReset();[true,true,true,true,true].forEach(function(){stkNote('x',true,false);});
  const rec=streakComplete();
  SILENT=false;
  const inNote=(typeof note==='string')&&/streak|reward|extra/i.test(note);
  ok('reward is announced in the play log / note',inNote,
     inNote?'':'reward recorded but not surfaced in the beat text');
})();
`);
console.log('');
T.forEach(t=>console.log('  '+(t.p?'PASS':'GAP ')+'  '+t.n.padEnd(46)+(t.d?'  '+t.d:'')));
console.log('');
console.log('  '+T.filter(t=>t.p).length+' / '+T.length);
console.log('');
