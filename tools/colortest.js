const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',style:{},value:'0',
  dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},appendChild(){},
  setAttribute(){},classList:{toggle(){},add(){},remove(){}},set disabled(v){},
  get disabled(){return false;},click(){},files:[],offsetWidth:1});
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
const R=true,B=false;
function seq(list){ stkReset(); list.forEach(function(x){
  if(x==='wild')stkNote('WILD',false,true,false);
  else stkNote(x.via?'X':'Y',x.red,false,!!x.via); }); return stkMultiplier(); }

// the reported bug, exactly: club, heart, heart, spade - two of them played off a wild
ok('the reported case: K-club Q-heart K-heart K-spade -> NO bonus',
   seq([{red:B,via:true},{red:R},{red:R},{red:B,via:true}])===1,
   'was scoring x2 because the black cards were played off wilds');
ok('all red, two of them via a wild -> x2',
   seq([{red:R,via:true},{red:R},{red:R},{red:R,via:true},{red:R}])===2);
ok('all black -> x2', seq([{red:B},{red:B},{red:B},{red:B},{red:B}])===2);
ok('mixed with no wilds -> no bonus', seq([{red:R},{red:R},{red:B},{red:R},{red:R}])===1);
ok('a wild SLOT is still colour-neutral',
   seq([{red:R},{red:R},'wild',{red:R},{red:R}])===2);
ok('a wild slot cannot rescue a mixed streak',
   seq([{red:R},{red:B},'wild',{red:R},{red:R}])===1);

// pending reward preview
STREAK_REWARD.type='ExtraCards';STREAK_REWARD.amount=1;
seq([{red:R},{red:R}]);
ok('pending shows the doubled amount while same-colour', stkPending().amount===2,
   stkPending().label);
seq([{red:R},{red:B}]);
ok('pending drops to base once colour breaks', stkPending().amount===1, stkPending().label);
STREAK_REWARD.type='WildCard';STREAK_REWARD.amount=1;
seq([{red:R},{red:R}]);
ok('a wild reward is not doubled', stkPending().amount===1, stkPending().label);

// pip colours come from the slots
STREAK_REWARD.type='ExtraCards';STREAK_REWARD.amount=1;
buildFixed(2,4,seedFor(LEVELS[2].short,4));
SILENT=true;
// play until three cards have actually been PLAYED, so the streak is non-empty
{let played=0;for(let s=0;s<60&&played<3;s++){const lg=legals();
  if(lg.length){play(lg[0]);played++;}else if(deckLeft()>0){draw();played=0;}else break;}}
SILENT=false;render();
const ph=store['pips'].innerHTML;
ok('pips are coloured per card', /pip (red|black|wildp)/.test(ph),
   ph.replace(/ title="[^"]*"/g,'').slice(0,150));
ok('meter announces the next reward', /card|coin|wild/i.test(store['mpay'].textContent),
   store['mpay'].textContent);
`);
console.log('');
T.forEach(t=>console.log('  '+(t.p?'PASS':'FAIL')+'  '+t.n.padEnd(56)+(t.d?'  '+t.d:'')));
console.log('');
console.log('  '+T.filter(t=>t.p).length+' / '+T.length);
console.log('');
