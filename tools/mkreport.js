const fs=require('fs');
const D=JSON.parse(fs.readFileSync('.full_rows.json','utf8'));
const R=D.rows;
const pct=(a,b)=>b?((100*a/b).toFixed(0)+'%'):'—';
const pc1=(a,b)=>b?((100*a/b).toFixed(1)+'%'):'—';
const avg=(a,f)=>a.length?(a.reduce((s,x)=>s+f(x),0)/a.length):0;
const built=R.filter(r=>r.built);
const played=built.filter(r=>!r.threw&&r.gotWin!==null);
const allResc=[].concat.apply([],played.map(r=>r.rescues||[]));

let md='';
md+='# Director test — 25 levels, all outcomes, 5 plays each\n\n';
md+='Streak reward **+1 extra card**, ruthlessness **0.50**. '+
    '25 levels \u00d7 5 outcomes \u00d7 5 passes = **'+R.length+' runs**, '+
    allResc.length+' rescues.\n\n';

// ---- 1. buildability -----------------------------------------------------
md+='## 1. Can the director build these levels?\n\n';
const byOut={};
R.forEach(r=>{(byOut[r.outcome]=byOut[r.outcome]||[]).push(r);});
md+='| Outcome | runs | built | verified | live |\n|---|---|---|---|---|\n';
Object.keys(byOut).forEach(k=>{
  const g=byOut[k], b=g.filter(x=>x.built);
  md+='| '+k+' | '+g.length+' | '+pct(b.length,g.length)+' | '+
      pct(b.filter(x=>x.mode!==4).length,g.length)+' | '+
      pct(b.filter(x=>x.mode===4).length,g.length)+' |\n';});
md+='\n**Overall: '+pct(built.length,R.length)+' built, '+
    pct(built.filter(r=>r.mode!==4).length,R.length)+' verified, '+
    pct(built.filter(r=>r.mode===4).length,R.length)+' live.**\n\n';

// which levels struggle
const byLvl={};
built.forEach(r=>{(byLvl[r.level]=byLvl[r.level]||[]).push(r);});
const weak=Object.keys(byLvl).filter(k=>{
  const g=byLvl[k];return g.filter(x=>x.mode===4).length/g.length>0.5;});
if(weak.length){
  md+='Levels mostly on live steering: **'+weak.join(', ')+'**\n\n';
}

// ---- 2. outcome fidelity -------------------------------------------------
md+='## 2. Does it land on the targeted outcome?\n\n';
function fid(rows){
  const held=rows.filter(r=>r.gotWin===r.wantWin);
  const exact=held.filter(r=>r.value===r.tvEnd);
  return {n:rows.length,held:held.length,exact:exact.length};
}
const F=fid(played);
md+='| | runs | outcome type held | landed on exact target |\n|---|---|---|---|\n';
md+='| **All** | '+F.n+' | **'+pc1(F.held,F.n)+'** | '+pct(F.exact,F.n)+' |\n';
[['verified',r=>r.mode!==4],['live',r=>r.mode===4]].forEach(([lab,f])=>{
  const g=fid(played.filter(f));
  if(g.n)md+='| '+lab+' | '+g.n+' | '+pc1(g.held,g.n)+' | '+pct(g.exact,g.n)+' |\n';});
md+='\n';
md+='| Outcome | runs | held | exact |\n|---|---|---|---|\n';
Object.keys(byOut).forEach(k=>{
  const g=fid(played.filter(r=>r.outcome===k));
  if(g.n)md+='| '+k+' | '+g.n+' | '+pc1(g.held,g.n)+' | '+pct(g.exact,g.n)+' |\n';});
const broke=played.filter(r=>r.gotWin!==r.wantWin);
md+='\n**Outcome-type failures: '+broke.length+' of '+played.length+'**\n\n';
if(broke.length){
  const g={};
  broke.forEach(r=>{const k=r.outcome+' \u2192 '+(r.gotWin?'WON':'LOST')+
    (r.mode===4?' (live)':' (verified)');g[k]=(g[k]||0)+1;});
  md+='| failure | count |\n|---|---|\n';
  Object.keys(g).sort((a,b)=>g[b]-g[a]).forEach(k=>md+='| '+k+' | '+g[k]+' |\n');
  md+='\n';
}

// ---- 3. streak rewards ---------------------------------------------------
md+='## 3. Streak rewards and deck absorption\n\n';
const withStreak=played.filter(r=>r.streaks>0);
const rungs={};
played.forEach(r=>{(r.rungs||'').split('/').filter(Boolean)
  .forEach(s=>{rungs[s]=(rungs[s]||0)+1;});});
const totalRungs=Object.values(rungs).reduce((a,b)=>a+b,0);
md+='| | |\n|---|---|\n';
md+='| Runs that completed at least one streak | '+pct(withStreak.length,played.length)+
    ' ('+withStreak.length+') |\n';
md+='| Total streaks completed | '+played.reduce((s,r)=>s+r.streaks,0)+' |\n';
md+='| Extra cards granted | '+played.reduce((s,r)=>s+(r.granted||0),0)+' |\n';
md+='| Supply changes absorbed | '+totalRungs+' |\n\n';
if(totalRungs){
  md+='**How the director absorbed them:**\n\n| rung | count | share |\n|---|---|---|\n';
  Object.keys(rungs).sort((a,b)=>rungs[b]-rungs[a]).forEach(k=>
    md+='| '+k+' | '+rungs[k]+' | '+pct(rungs[k],totalRungs)+' |\n');
  md+='\n';
  const liveShare=(rungs.live||0)/totalRungs;
  md+='Fell through to live steering on **'+pct(rungs.live||0,totalRungs)+
      '** of supply changes.\n\n';
}
// did streaks damage fidelity?
const fs0=fid(played.filter(r=>r.streaks===0));
const fs1=fid(withStreak);
md+='| | runs | outcome held |\n|---|---|---|\n';
md+='| no streak fired | '+fs0.n+' | '+pc1(fs0.held,fs0.n)+' |\n';
md+='| streak fired | '+fs1.n+' | '+pc1(fs1.held,fs1.n)+' |\n\n';

// ---- 4. rescues ----------------------------------------------------------
md+='## 4. Extra Card Experience Director\n\n';
const empty=allResc.filter(r=>r.cleared===0);
const dealt=allResc.reduce((s,r)=>s+r.dealt,0);
const dead=allResc.reduce((s,r)=>s+r.dead,0);
md+='| | result | target |\n|---|---|---|\n';
md+='| Rescues bought | '+allResc.length+' | |\n';
md+='| Cleared nothing at all | **'+pct(empty.length,allResc.length)+'** | 10\u201320% |\n';
md+='| Dead cards | '+pct(dead,dealt)+' | |\n';
md+='| Cards cleared per rescue | **'+avg(allResc,r=>r.cleared).toFixed(1)+'** | |\n';
md+='| Rescues that cleared the board | '+pct(allResc.filter(r=>r.won).length,allResc.length)+' | |\n';
md+='| Worst blanks inside one rescue | '+Math.max(0,...allResc.map(r=>r.blank))+' | 2 |\n\n';
function bucket(f){
  const g=allResc.filter(f);
  if(!g.length)return null;
  const d=g.reduce((s,r)=>s+r.dealt,0);
  return {n:g.length,empty:100*g.filter(r=>r.cleared===0).length/g.length,
    dead:d?100*g.reduce((s,r)=>s+r.dead,0)/d:0,
    cl:avg(g,r=>r.cleared),won:100*g.filter(r=>r.won).length/g.length,
    blank:Math.max(0,...g.map(r=>r.blank))};
}
md+='**By board size when the rescue was bought:**\n\n';
md+='| board | rescues | empty | dead cards | cleared/rescue | cleared board | worst blanks |\n';
md+='|---|---|---|---|---|---|---|\n';
[['1 card',r=>r.before===1],['2\u20133',r=>r.before>=2&&r.before<=3],
 ['4\u20136',r=>r.before>=4&&r.before<=6],['7+',r=>r.before>=7]].forEach(([lab,f])=>{
  const b=bucket(f);if(!b)return;
  md+='| '+lab+' | '+b.n+' | **'+b.empty.toFixed(0)+'%** | '+b.dead.toFixed(0)+'% | '+
      b.cl.toFixed(1)+' | '+b.won.toFixed(0)+'% | '+b.blank+' |\n';});
md+='\n';
// intent gate
const byIntent={};
allResc.forEach(r=>{(byIntent[r.intent]=byIntent[r.intent]||[]).push(r);});
md+='**Intent gate:**\n\n| intent | rescues | cleared the board |\n|---|---|---|\n';
Object.keys(byIntent).sort().forEach(k=>{
  const g=byIntent[k];
  md+='| '+k+' | '+g.length+' | '+pc1(g.filter(r=>r.won).length,g.length)+' |\n';});
md+='\n';
// dry decisions
const dry=allResc.filter(r=>r.dry);
md+='Rescues **deliberately** empty (budgeted): '+pct(dry.length,allResc.length)+
    '. Empty but not budgeted: '+pct(empty.length-dry.filter(r=>r.cleared===0).length,
    allResc.length)+' \u2014 these are the 1-card boards where "did not win" and "empty" '+
    'are the same event.\n\n';

// ---- 5. safety -----------------------------------------------------------
md+='## 5. Safety invariants\n\n';
const bugs=[];played.forEach(r=>(r.bugs||[]).forEach(b=>bugs.push(r.level+': '+b)));
const threw=built.filter(r=>r.threw);
const gate=allResc.filter(r=>r.intent!=='win'&&r.won);
md+='| invariant | result |\n|---|---|\n';
md+='| A rescue told to fall short never wins | '+(gate.length?'**'+gate.length+' BREACHES**':'**0 breaches**')+' |\n';
md+='| Rank supply never oversubscribed | '+(bugs.filter(b=>/supply/.test(b)).length?
    '**'+bugs.filter(b=>/supply/.test(b)).length+' violations**':'**0 violations**')+' |\n';
md+='| Live pool never negative | '+(bugs.filter(b=>/pool/.test(b)).length?
    '**'+bugs.filter(b=>/pool/.test(b)).length+'**':'**0**')+' |\n';
md+='| No exceptions during play | '+(threw.length?'**'+threw.length+' thrown**':'**0 thrown**')+' |\n\n';
if(threw.length){
  md+='Exceptions:\n\n';
  [...new Set(threw.map(r=>r.threw))].slice(0,5).forEach(x=>md+='- `'+x+'`\n');
  md+='\n';
}

// ---- 6. per level --------------------------------------------------------
md+='## 6. Per level\n\n';
md+='| level | cards | deck | built | verified | outcome held | rescues | empty |\n';
md+='|---|---|---|---|---|---|---|---|\n';
Object.keys(byLvl).sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1))).forEach(k=>{
  const g=byLvl[k], p=g.filter(r=>!r.threw&&r.gotWin!==null);
  const rs=[].concat.apply([],p.map(r=>r.rescues||[]));
  const all=R.filter(r=>r.level===k);
  md+='| '+k+' | '+g[0].N+' | '+g[0].deckN+' | '+pct(g.length,all.length)+' | '+
      pct(g.filter(x=>x.mode!==4).length,all.length)+' | '+
      (p.length?pc1(p.filter(r=>r.gotWin===r.wantWin).length,p.length):'—')+' | '+
      rs.length+' | '+(rs.length?pct(rs.filter(r=>r.cleared===0).length,rs.length):'—')+' |\n';});
md+='\n';

fs.writeFileSync('director_report.md',md);
// console summary
console.log('');
console.log('  runs '+R.length+'   built '+pct(built.length,R.length)+
  '   verified '+pct(built.filter(r=>r.mode!==4).length,R.length));
console.log('  outcome held '+pc1(F.held,F.n)+'   exact '+pct(F.exact,F.n)+
  '   failures '+broke.length);
console.log('  rescues '+allResc.length+'   empty '+pct(empty.length,allResc.length)+
  '   cleared/rescue '+avg(allResc,r=>r.cleared).toFixed(1)+
  '   worst blanks '+Math.max(0,...allResc.map(r=>r.blank)));
console.log('  gate breaches '+gate.length+'   supply '+bugs.filter(b=>/supply/.test(b)).length+
  '   exceptions '+threw.length);
console.log('  wrote director_report.md');
console.log('');
