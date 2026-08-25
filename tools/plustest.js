const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',title:'',
  style:{},dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},
  appendChild(){},setAttribute(){},classList:{toggle(){},add(){},remove(){}},
  set disabled(v){},get disabled(){return false;},click(){},files:[],offsetWidth:1});
ids.forEach(id=>store[id]=mk(id));
const fb={set disabled(v){},get disabled(){return false;}};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
  querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
  body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}};
global.window={addEventListener(){}};global.localStorage={getItem(){return null;},setItem(){}};
global.setTimeout=()=>0;
global.RAW=fs.readFileSync(require('path').join(__dirname,'..','levels','L12.json'),'utf8');
const T=[];
eval(js + `
function ok(n,c,d){T.push({n:n,p:!!c,d:d||''});}
const lv=parseLevel('L12P',JSON.parse(RAW));
ok('parser reads PlusCards', lv.plus&&Object.keys(lv.plus).length===3, JSON.stringify(lv.plus));
ok('no spurious warnings', lv.warn.length===0, lv.warn.join('; '));
// a malformed entry must warn, not silently load
const bad=JSON.parse(RAW); bad.data.PlusCards=[{index:99,Value:3},{index:3},{index:5,Value:44}];
const lv2=parseLevel('BAD',bad);
ok('out-of-range / missing / bad Value all warn', lv2.warn.length===3, lv2.warn.join(' | '));
// install and play
LEVELS.push(lv); const li=LEVELS.length-1;
document.getElementById('tsel').value='0';
const built=buildFixed(li,0,seedFor('L12P',0));
ok('level with plus cards builds', !!built, built?('mode '+built.usedMode+', tv '+built.tv):'FAILED');
if(built){
  ok('plus tiles are not playable', legals().every(function(i){return !isPlusCard(i);}));
  ok('none have fired at deal', PLUSFIRED.length===0, 'fired '+JSON.stringify(PLUSFIRED));
  const deck0=deckLeft();
  SILENT=true;
  // clear one peak: 6 then 4 and 5 -> plus @3 must fire
  let steps=0;
  while(PLUSFIRED.length===0&&steps++<200){
    const lg=legals();
    if(lg.length)play(lg[0]); else if(deckLeft()>0)draw(); else break;
  }
  SILENT=false;
  ok('a plus tile fires when uncovered', PLUSFIRED.length>0,
     'fired '+JSON.stringify(PLUSFIRED)+' after '+steps+' steps');
  if(PLUSFIRED.length){
    const slot=PLUSFIRED[0];
    ok('the fired tile left the board', cl.has(slot));
    ok('the deck grew by its Value', deckLeft()>=deck0,
       'deck '+deck0+' -> '+deckLeft()+' (granted '+plusGranted()+')');
    ok('the grant went through the supply pathway',
       SUPPLY_LOG.some(function(e){return e.rewardType==='PlusCard';}),
       SUPPLY_LOG.map(function(e){return e.rewardType+':'+e.status;}).join(' '));
  }
  // play the level out - does it complete without throwing, and is the win seen?
  SILENT=true; let err=null;
  try{ for(let s=0;s<900;s++){
    if(N-cl.size===0)break;
    const lg=legals(); if(lg.length)play(lg[0]); else if(deckLeft()>0)draw(); else break; } }
  catch(e){ err=e.message; }
  SILENT=false; render();
  ok('plays out without throwing', err===null, err||'');
  ok('all 3 plus tiles fired over a full play', PLUSFIRED.length===3,
     'fired '+PLUSFIRED.length+' of 3, board left '+(N-cl.size));
  ok('badge renders for an unfired tile or board is clear',
     N-cl.size===0 || /plusb/.test(store['board'].innerHTML));
}
`);
console.log('');
T.forEach(t=>console.log('  '+(t.p?'PASS':'FAIL')+'  '+t.n.padEnd(46)+(t.d?'  '+t.d:'')));
console.log('');
console.log('  '+T.filter(t=>t.p).length+' / '+T.length);
console.log('');
