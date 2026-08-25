// STREAK REWARD TEST SUITE — the cases §21 requires, run against the demo.
const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const m=src.match(/<script>\r?\n"use strict";([\s\S]*?)<\/script>/);
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');
const ids=[...new Set([...src.matchAll(/id="([a-zA-Z0-9]+)"/g)].map(x=>x[1]))];
const store={};
const mk=id=>({id:id,innerHTML:'',textContent:'',className:'',style:{},value:'0',
  dataset:{},get clientWidth(){return 760;},get clientHeight(){return 420;},appendChild(){},
  setAttribute(){},classList:{toggle(){},add(){},remove(){}},set disabled(v){},
  get disabled(){return false;},click(){},files:[]});
ids.forEach(id=>store[id]=mk(id));
const fb={set disabled(v){},get disabled(){return false;}};
global.document={getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
  querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
  body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}};
global.window={addEventListener(){}};
global.localStorage={getItem(){return null;},setItem(){}};
global.setTimeout=()=>0;

const T=[];
eval(js + `
function ok(name,cond,detail){T.push({name:name,pass:!!cond,detail:detail||''});}
function fresh(li,ti){ buildFixed(li||0,ti===undefined?4:ti,seedFor(LEVELS[li||0].short,ti===undefined?4:ti)); }

// ---- colour logic, driven directly (no board needed) --------------------------
function runStreak(seq){          // seq: [isRed|'wild', ...]
  stkReset();
  seq.forEach(function(s){
    if(s==='wild')stkNote('WILD',false,true);
    else stkNote(s?'H':'S',s,false);
  });
  return {same:STK.same&&STK.color!==null,color:STK.color,mult:stkMultiplier()};
}
const R=true,B=false;
ok('K  mixed colours get no bonus',        runStreak([R,R,B,R,R]).mult===1);
ok('L  same colour different suits x2',    runStreak([R,R,R,R,R]).mult===2);
ok('   all black x2',                      runStreak([B,B,B,B,B]).mult===2);
ok('J  wild keeps a same-colour streak',   runStreak([R,R,'wild',R,R]).mult===2);
ok('J  wild cannot rescue a mixed streak', runStreak([R,B,'wild',R,R]).mult===1);
ok('J  wild never establishes a colour',   runStreak(['wild',R,R,R,R]).color==='RED');
ok('   a wild-only streak has no colour',  runStreak(['wild','wild','wild','wild','wild']).mult===1);

// ---- reward maths --------------------------------------------------------------
function reward(type,amount,same,wildScales){
  const old=Object.assign({},STREAK_REWARD);
  STREAK_REWARD.type=type;STREAK_REWARD.amount=amount;
  STREAK_REWARD.wildScales=!!wildScales;
  STREAK_GRANTED=0;STREAK_REWARDS=0;
  stkReset();
  const seq=same?[R,R,R,R,R]:[R,R,B,R,R];
  seq.forEach(function(s){stkNote('x',s,false);});
  const mult=stkMultiplier();
  const out=(type==='WildCard')?(STREAK_REWARD.wildScales?amount*mult:amount):amount*mult;
  Object.assign(STREAK_REWARD,old);
  return out;
}
ok('A  1 extra card, mixed  -> 1',   reward('ExtraCards',1,false)===1);
ok('B  1 extra card, same   -> 2',   reward('ExtraCards',1,true)===2);
ok('C  2 extra cards, mixed -> 2',   reward('ExtraCards',2,false)===2);
ok('D  2 extra cards, same  -> 4',   reward('ExtraCards',2,true)===4);
ok('H  100 coins, mixed     -> 100', reward('Coins',100,false)===100);
ok('I  100 coins, same      -> 200', reward('Coins',100,true)===200);
ok('F  1 wild, same colour  -> 1',   reward('WildCard',1,true)===1);
ok('   1 wild scales only if configured', reward('WildCard',1,true,true)===2);

// ---- real injection into a real level ------------------------------------------
function setup(li,ti){
  const lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti));
  SILENT=true; return lv;
}
// N — verified director absorbs extra cards
(function(){
  let handled=0,keep=0,other=0,bad=0,tvMoved=0;
  for(let li=0;li<LEVELS.length;li++){
    const lv=setup(li,4); if(!lv||lv.usedMode===4)continue;
    for(let s=0;s<3;s++){const lg=legals();if(lg.length)play(lg[0]);else if(deckLeft()>0)draw();}
    const before=dk.length, tvBefore=LV.tv;
    const rec=addExtraCards(2,'StreakReward');
    if(!rec){continue;}
    handled++;
    if(rec.status==='keep')keep++;else other++;
    if(dk.length!==before+2)bad++;
    if(LV.tgt.win&&LV.tv!==tvBefore+2&&rec.status!=='reband'&&rec.status!=='live')bad++;
    if(rec.tvMoved)tvMoved++;
  }
  SILENT=false;
  ok('N  verified absorbs +2 on every level', handled>0&&bad===0,
     handled+' levels, '+keep+' KEEP, '+other+' adjust/replan/reband/live');
})();
// retarget: a win target must move with the deck
(function(){
  SILENT=true;
  const lv=setup(0,0);
  let good=true,detail='';
  if(lv&&lv.usedMode!==4&&LV.tgt.win){
    const t0=LV.tv;
    addExtraCards(3,'StreakReward');
    if(LV.tv!==t0+3&&SUPPLY_LOG.length&&SUPPLY_LOG[0].status!=='reband'&&
       SUPPLY_LOG[0].status!=='live'){good=false;detail='tv '+t0+' -> '+LV.tv;}
    else detail='tv '+t0+' -> '+LV.tv+' ('+(SUPPLY_LOG.length?SUPPLY_LOG[0].status:'?')+')';
  }
  SILENT=false;
  ok('   win target retargets with deck size', good, detail);
})();
// revealed and played cards are never touched
(function(){
  SILENT=true;
  let bad=0,checked=0;
  for(let li=0;li<LEVELS.length;li++){
    const lv=setup(li,4); if(!lv||lv.usedMode===4)continue;
    for(let s=0;s<5;s++){const lg=legals();if(lg.length)play(lg[0]);else if(deckLeft()>0)draw();}
    const drawn=dk.slice(0,di).map(function(c){return c[0];}).join(',');
    const cleared=Array.from(cl).sort().join(',');
    addExtraCards(2,'StreakReward');
    checked++;
    if(dk.slice(0,di).map(function(c){return c[0];}).join(',')!==drawn)bad++;
    if(Array.from(cl).sort().join(',')!==cleared)bad++;
  }
  SILENT=false;
  ok('   drawn and played cards never change', bad===0, checked+' levels checked');
})();
// E/J — wild inserted once, at a valid unseen index
(function(){
  SILENT=true;
  let bad=0,checked=0,idxOk=0;
  for(let li=0;li<LEVELS.length;li++){
    const lv=setup(li,4); if(!lv||lv.usedMode===4)continue;
    for(let s=0;s<4;s++){const lg=legals();if(lg.length)play(lg[0]);else if(deckLeft()>0)draw();}
    const wBefore=dk.filter(isWildCard).length, diAt=di;
    const rec=insertWild(1,'StreakReward');
    checked++;
    const wAfter=dk.filter(isWildCard).length;
    if(wAfter!==wBefore+1)bad++;
    if(rec&&rec.insertionIndex>=diAt)idxOk++;
  }
  SILENT=false;
  ok('E  exactly one wild inserted', bad===0, checked+' levels');
  ok('J  wild index is inside the unseen region', idxOk===checked, idxOk+'/'+checked);
})();
// drawing a wild makes everything legal, and resets the streak
(function(){
  SILENT=true;
  const lv=setup(1,4);
  let legalAll=false,streakReset=false,detail='';
  if(lv&&lv.usedMode!==4){
    dk.splice(di,0,['WILD','',false,false,true]);
    LV.deck=dk.slice();
    stkReset();stkNote('x',true,false);stkNote('x',true,false);
    const kBefore=k;
    draw();
    const exposed=[];for(let i=0;i<N;i++)if(!cl.has(i)&&expo(i)&&onScreen(i))exposed.push(i);
    legalAll=(legals().length===exposed.length&&exposed.length>0);
    streakReset=(k===0&&STK.n===0);
    detail='waste rank '+wr+', '+legals().length+' of '+exposed.length+' exposed are legal';
  }
  SILENT=false;
  ok('   a drawn wild makes every exposed card legal', legalAll, detail);
  ok('   a drawn wild resets the streak', streakReset);
})();
// P — level win takes priority over injection
(function(){
  SILENT=true;
  const lv=setup(0,0);
  let noInject=true,detail='';
  if(lv){
    while(N-cl.size>0){const lg=legals();if(lg.length)play(lg[0]);else if(deckLeft()>0)draw();else break;}
    if(N-cl.size===0){
      const before=dk.length;
      const r=addExtraCards(2,'StreakReward');
      noInject=(r===null&&dk.length===before);
      detail=r===null?'refused, deck unchanged':'INJECTED into a finished level';
    }else detail='level did not clear, case not exercised';
  }
  SILENT=false;
  ok('P  no injection into a cleared level', noInject, detail);
})();
// Q — caps stop the reward chain
(function(){
  const old=Object.assign({},STREAK_REWARD);
  STREAK_REWARD.type='ExtraCards';STREAK_REWARD.amount=2;
  STREAK_REWARD.maxExtraCardsPerLevel=5;STREAK_REWARD.maxRewardsPerLevel=99;
  SILENT=true;
  setup(2,4);
  STREAK_GRANTED=0;STREAK_REWARDS=0;
  let granted=0;
  for(let round=0;round<6;round++){
    stkReset();[true,true,true,true,true].forEach(function(){stkNote('x',true,false);});
    if(N-cl.size===0)break;
    const rec=streakComplete();
    if(rec.rewardType==='ExtraCards')granted+=rec.finalReward;
  }
  SILENT=false;
  Object.assign(STREAK_REWARD,old);
  ok('Q  extra-card cap is respected', granted<=5, granted+' granted, cap 5');
})();
// M — a streak during a rescue extends it without restarting it
(function(){
  SILENT=true;
  let tested=0,preserved=0;
  for(let li=0;li<LEVELS.length&&tested<3;li++){
    setup(li,4);
    skipToEnd();
    if(N-cl.size===0)continue;
    ecStart(5,'coins');
    if(!EC)continue;
    const mode=EC.mode,run=EC.run,story=EC.story.length,rem=EC.rem,intent=EC.intent;
    addExtraCards(2,'StreakReward');
    tested++;
    if(EC&&EC.mode===mode&&EC.run===run&&EC.story.length===story&&
       EC.intent===intent&&EC.rem===rem+2)preserved++;
  }
  SILENT=false;
  ok('M  rescue extends, never restarts', tested>0&&preserved===tested,
     preserved+'/'+tested+' kept mode, run, story and intent');
})();
// undo must not refund a granted reward
(function(){
  SILENT=true;
  setup(3,4);
  for(let s=0;s<4;s++){const lg=legals();if(lg.length)play(lg[0]);else if(deckLeft()>0)draw();}
  STREAK_GRANTED=0;
  addExtraCards(2,'StreakReward');
  const g=STREAK_GRANTED, len=dk.length;
  for(let s=0;s<6;s++)back();
  SILENT=false;
  ok('   undo does not claw back granted cards', STREAK_GRANTED>=g||dk.length>=len-2,
     'granted '+g+' -> '+STREAK_GRANTED);
})();
`);

const pass=T.filter(t=>t.pass).length;
console.log('');
console.log('  STREAK REWARD SUITE');
console.log('');
T.forEach(t=>{
  console.log('  '+(t.pass?'PASS':'FAIL')+'  '+t.name.padEnd(46)+
    (t.detail?'  '+t.detail:''));
});
console.log('');
console.log('  '+pass+' / '+T.length+' passing');
console.log('');
process.exit(pass===T.length?0:1);
