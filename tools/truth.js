// Every surface that claims a bonus must agree with what the player actually receives.
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',title:'',
  style:{},dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},
  appendChild(){},setAttribute(){},classList:{toggle(){},add(){},remove(){}},
  set disabled(v){},get disabled(){return false;},click(){},files:[],offsetWidth:1});
ids.forEach(id=>store[id]=mk(id));
const fb={set disabled(v){},get disabled(){return false;}};
const made=[];
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),
  createElement:()=>{const e=mk('x');made.push(e);return e;},
  querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
  body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}};
global.window={addEventListener(){}};global.localStorage={getItem(){return null;},setItem(){}};
global.setTimeout=()=>0;
const T=[];
eval(js + `
function ok(n,c,d){T.push({n:n,p:!!c,d:d||''});}
const R=true,B=false;
function build5(type,amount,same,cap){
  STREAK_REWARD.type=type;STREAK_REWARD.amount=amount;
  STREAK_REWARD.maxExtraCardsPerLevel=(cap===undefined?6:cap);
  STREAK_GRANTED=0;STREAK_REWARDS=0;
  buildFixed(2,4,seedFor(LEVELS[2].short,4));
  stkReset();k=0;
  const seq=same?[R,R,R,R,R]:[R,R,B,R,R];
  seq.forEach(function(x){stkNote('X',x,false,false);k++;});
}
function surfaces(type,amount,same,cap){
  build5(type,amount,same,cap);
  render();
  const meterBadge=store['mx2'].style.display==='none'?'':store['mx2'].textContent;
  const meterText=store['mpay'].textContent;
  const panel=store['stkpanel'].innerHTML;
  made.length=0;
  const rec=streakComplete();
  const toast=made.length?made[made.length-1].innerHTML:'';
  return {rec:rec,meterBadge:meterBadge,meterText:meterText,panel:panel,toast:toast};
}
// --- the reported case: a wild on an all-red streak ---
(function(){
  const s=surfaces('WildCard',1,true);
  ok('wild + same colour pays 1', s.rec.finalReward===1, 'paid '+s.rec.finalReward);
  ok('   meter shows no x2 badge', s.meterBadge==='', 'badge="'+s.meterBadge+'"');
  ok('   toast does not claim a bonus', !/BONUS/.test(s.toast), s.toast.replace(/<[^>]*>/g,' '));
  ok('   toast still says ALL RED', /ALL RED/.test(s.toast));
  ok('   panel says the reward does not scale',
     /does not scale/.test(s.panel), '');
  ok('   record marks bonusApplied false', s.rec.bonusApplied===false);
})();
// --- coins: the bonus is real ---
(function(){
  const s=surfaces('Coins',100,true);
  ok('coins + same colour pays 200', s.rec.finalReward===200);
  ok('   meter shows x2', s.meterBadge==='\\u00d72', s.meterBadge);
  ok('   toast claims x2', /\\u00d72 BONUS/.test(s.toast));
  ok('   record marks bonusApplied true', s.rec.bonusApplied===true);
})();
// --- extra cards clamped by the level cap ---
(function(){
  const s=surfaces('ExtraCards',2,true,3);      // wants 4, cap allows 3
  ok('cap clamps the payout', s.rec.finalReward===3, 'paid '+s.rec.finalReward+' of 4 wanted');
  ok('   effective multiplier is 1.5 not 2', s.rec.effMultiplier===1.5, 'x'+s.rec.effMultiplier);
  ok('   toast reports the real multiplier', /\\u00d71.5 BONUS/.test(s.toast),
     s.toast.replace(/<[^>]*>/g,' '));
})();
// --- extra cards with room: full double ---
(function(){
  const s=surfaces('ExtraCards',2,true,6);
  ok('uncapped extra cards pay 4', s.rec.finalReward===4);
  ok('   meter shows x2', s.meterBadge==='\\u00d72');
})();
// --- mixed colour: nothing claims anything ---
(function(){
  const s=surfaces('Coins',100,false);
  ok('mixed pays base', s.rec.finalReward===100);
  ok('   meter shows no badge', s.meterBadge==='');
  ok('   toast says STREAK COMPLETE', /STREAK COMPLETE/.test(s.toast));
})();
`);
console.log('');
T.forEach(t=>console.log('  '+(t.p?'PASS':'FAIL')+'  '+t.n.padEnd(42)+(t.d?'  '+t.d:'')));
console.log('');
console.log('  '+T.filter(t=>t.p).length+' / '+T.length);
console.log('');
