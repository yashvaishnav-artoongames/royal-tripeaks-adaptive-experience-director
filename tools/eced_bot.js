// ECED BOT — runs every level against both losing outcomes, many times, with several
// player personalities, and reports how the Extra Card Experience Director behaves.
//
//   node eced_bot.js [intensity] [passes] [maxRescues] [--levels <path>...] [--only-loaded]
//
//   node eced_bot.js 0.60 8 8
//   node eced_bot.js 0.60 8 8 --levels ./levels
//   node eced_bot.js 0.60 8 8 --levels ./levels --only-loaded
//
// --levels takes folders or individual .json level exports, in the format the page's
// "Load levels..." button accepts. By default they are added to the ten built-in levels;
// --only-loaded runs your levels alone.
//
// Writes eced_report.md and eced_rescues.csv next to itself.

const fs=require('fs'),path=require('path');
// ---- arguments ---------------------------------------------------------------
const argv=process.argv.slice(2), pos=[], levelPaths=[];
let ONLY_LOADED=false;
for(let i=0;i<argv.length;i++){
  const a=argv[i];
  if(a==='--levels'){ while(i+1<argv.length && argv[i+1].slice(0,2)!=='--') levelPaths.push(argv[++i]); }
  else if(a==='--only-loaded'||a==='--only') ONLY_LOADED=true;
  else if(a==='--no-cache') {}   // handled above
  else if(a.slice(0,2)==='--'){ console.error('unknown option '+a); process.exit(1); }
  else pos.push(a);
}
const INTENSITY = parseFloat(pos[0] || '0.60');
const PASSES     = parseInt(pos[1] || '8', 10);
const MAX_RESCUE = parseInt(pos[2] || '8', 10);
const HTML = path.join(__dirname,'..','index.html');
const crypto=require('crypto');
const NOCACHE = argv.indexOf('--no-cache')>=0;
const CACHE_FILE = path.join(__dirname,'.eced_cache.json');
let CACHE={ver:'',levels:{}}, CHIT=0, CMISS=0, CDIRTY=false;

// ---- level files ---------------------------------------------------------------
// Reads the same .json exports the page ingests. Parsing happens inside the director's
// own parseLevel(), so a level that loads in the app loads here identically.
function collectLevelFiles(paths){
  const out=[];
  paths.forEach(function(p){
    let st;
    try{ st=fs.statSync(p); }catch(e){ console.error('  cannot read '+p); return; }
    if(st.isDirectory()){
      fs.readdirSync(p).filter(function(f){return /\.json$/i.test(f);}).sort()
        .forEach(function(f){ out.push({name:f.replace(/\.json$/i,''),
          text:fs.readFileSync(path.join(p,f),'utf8')}); });
    } else if(/\.json$/i.test(p)){
      out.push({name:path.basename(p).replace(/\.json$/i,''),text:fs.readFileSync(p,'utf8')});
    } else console.error('  skipping '+p+' (not a .json file or folder)');
  });
  return out;
}
global.__levelFiles = levelPaths.length ? collectLevelFiles(levelPaths) : [];
global.__onlyLoaded = ONLY_LOADED;
if(levelPaths.length && !global.__levelFiles.length){
  console.error('No .json level files found in: '+levelPaths.join(', '));
  process.exit(1);
}

// ---- load the director out of the page --------------------------------------
const src=fs.readFileSync(HTML,'utf8');
const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
if(!m){console.error('could not find the script block in '+HTML);process.exit(1);}
let js=m[1].replace(/const ls=document\.getElementById\('lsel'\)[\s\S]*$/,'');

// The cache is keyed on a hash of the page, so changing the director invalidates every
// stored level rather than silently testing stale ones.
const SRCHASH=crypto.createHash('sha1').update(src).digest('hex').slice(0,12)+
  '|'+(global.__levelFiles.length?global.__levelFiles.map(f=>f.name).join(','):'builtin')+
  '|'+(ONLY_LOADED?'only':'plus');
if(!NOCACHE&&fs.existsSync(CACHE_FILE)){
  try{const c=JSON.parse(fs.readFileSync(CACHE_FILE,'utf8'));if(c.ver===SRCHASH)CACHE=c;}
  catch(e){}
}
CACHE.ver=SRCHASH;
global.__cacheGet=function(k){
  if(NOCACHE)return null;
  const v=CACHE.levels[k];
  if(v!==undefined){CHIT++;return v;}
  CMISS++;return null;};
global.__cacheSet=function(k,v){if(!NOCACHE){CACHE.levels[k]=v;CDIRTY=true;}};

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

const RESULT = {};

// ---- progress ---------------------------------------------------------------
// A long run with no output looks like a hang. Rewrite one line in place on a terminal,
// print a new line when piped to a file so the log stays readable either way.
const TTY = !!process.stdout.isTTY;
function hms(s){
  s=Math.max(0,Math.round(s));
  const m=Math.floor(s/60), r=s%60;
  return m? (m+'m '+String(r).padStart(2,'0')+'s') : (r+'s');
}
let T0=Date.now(), TOTAL=0, LASTDRAW=0;
global.__begin=function(total,cfg){
  TOTAL=total; T0=Date.now();
  console.log('');
  console.log('  ECED bot');
  console.log('  intensity ' + INTENSITY.toFixed(2) + '   passes ' + PASSES +
              '   max rescues per board ' + MAX_RESCUE);
  if(cfg.loaded) console.log('  ' + cfg.loaded + ' level file(s) loaded from disk');
  console.log('  ' + cfg.levels + ' levels x ' + cfg.outcomes + ' losing outcomes x ' +
              cfg.styles + ' player styles x ' + PASSES + ' passes = ' + total + ' boards');
  const builds = total / cfg.styles;
  const known = Object.keys(CACHE.levels).length;
  console.log('  ' + builds + ' levels to generate' +
    (known ? ', ' + known + ' already cached' : '') + (NOCACHE ? ' (cache off)' : ''));
  console.log('  this takes roughly ' +
    hms(Math.max(5, builds * 1.55 * (known >= builds ? 0.04 : 1))) + '. progress below.');
  console.log('');
};
global.__tick=function(done, rescues, cleared){
  const now=Date.now();
  if(done<TOTAL && now-LASTDRAW<250) return;   // do not thrash the terminal
  LASTDRAW=now;
  const el=(now-T0)/1000;
  const eta=done? el/done*(TOTAL-done) : 0;
  const bar=Math.round(28*done/TOTAL);
  const line='  [' + '#'.repeat(bar) + '-'.repeat(28-bar) + '] ' +
    String(Math.round(100*done/TOTAL)).padStart(3) + '%  ' +
    String(done).padStart(String(TOTAL).length) + '/' + TOTAL + ' boards  ' +
    'elapsed ' + hms(el).padEnd(8) + ' eta ' + hms(eta).padEnd(8) +
    rescues + ' rescues  ' + (rescues? Math.round(100*cleared/rescues) : 0) + '% cleared';
  if(TTY) process.stdout.write('\r' + line.padEnd(118).slice(0,118));
  else if(done % 40 === 0 || done === TOTAL) console.log(line);
};
global.__endProgress=function(){ if(TTY) process.stdout.write('\n\n'); else console.log(''); };
eval(js + `
// ---------------------------------------------------------------------------
// PLAYER PERSONALITIES
// A card that is right for a greedy player can be wrong for a cautious one, so the
// director has to hold up against all of them - not just the one the sweep happens
// to use. 'sloppy' also misplays on purpose, which is the adversarial case.
// ---------------------------------------------------------------------------
const STYLES=['greedy','random','safe','sloppy'];

function chainFrom(i){            // how long a run this card starts, greedily
  const save=new Set(cl); let w=LV.rank[i],n=1; cl.add(i);
  for(let g=0;g<12;g++){
    let nx=-1;
    for(let z=0;z<N;z++){
      if(cl.has(z)||LV.rank[z]===undefined)continue;
      if(!expo(z)||!onScreen(z))continue;
      if(!cyc(LV.rank[z],w))continue;
      nx=z;break;}
    if(nx<0)break;
    cl.add(nx);w=LV.rank[nx];n++;}
  cl=save; return n;
}
function botChoose(style,lg){
  if(style==='random')return lg[Math.floor(rnd()*lg.length)];
  if(style==='safe'){          // take the card that frees the most behind it
    let best=lg[0],bn=-1;
    for(const i of lg){const u=unl(i);if(u>bn){bn=u;best=i;}}
    return best;}
  if(style==='greedy'||style==='sloppy'){
    let best=lg[0],bn=-1;
    for(const i of lg){const c=chainFrom(i);if(c>bn){bn=c;best=i;}}
    return best;}
  return lg[0];
}
// play until the board clears or the cards run out
function botRun(style,limit){
  let moves=0;
  while(moves++<limit){
    if(N-cl.size===0)return 'won';
    const lg=legals();
    if(lg.length){
      if(style==='sloppy'&&deckLeft()>0&&rnd()<0.12){miss1();continue;}
      play(botChoose(style,lg));
    } else if(deckLeft()>0){ draw(); }
    else return 'dead';
  }
  return 'stuck';
}

// ---------------------------------------------------------------------------
// ONE BOARD: play the level down, then buy rescues like a persistent player
// ---------------------------------------------------------------------------
// A built level survives a JSON round trip exactly - same move sequence, same end state -
// so a given level, outcome and seed only ever needs generating once, across runs as well
// as within one. Everything else about the board is restored by reset().
// JSON.stringify turns an undefined array slot into null. LV.LB carries undefined for
// every face-down card on a live level, so a naive round trip hands the director null
// where it expects undefined - which surfaces later as "cannot read properties of null".
function ecDeNull(lv){
  ['LB'].forEach(function(k){
    if(Array.isArray(lv[k]))for(let i=0;i<lv[k].length;i++)if(lv[k][i]===null)delete lv[k][i];
    if(lv.base&&Array.isArray(lv.base[k]))
      for(let i=0;i<lv.base[k].length;i++)if(lv.base[k][i]===null)delete lv.base[k][i];});
  ['rank'].forEach(function(k){
    if(lv[k])for(const i in lv[k])if(lv[k][i]===null)delete lv[k][i];
    if(lv.base&&lv.base[k])for(const i in lv.base[k])if(lv.base[k][i]===null)delete lv.base[k][i];});
  return lv;
}
function buildCached(li,ti,seed){
  const key=LEVELS[li].short+'|'+ti+'|'+seed;
  const hit=global.__cacheGet(key);
  if(hit!==null){
    if(hit==='')return null;                   // remembered as unbuildable
    useLevel(li);
    document.getElementById('tsel').value=String(ti);
    LV=ecDeNull(JSON.parse(hit));
    LV.tgt=OUT[ti];                            // the describer does not survive JSON
    SILENT=true;reset();SILENT=false;
    return LV;
  }
  let lv=null;
  try{ lv=buildFixed(li,ti,seed); }catch(e){ global.__cacheSet(key,''); throw e; }
  global.__cacheSet(key,lv?JSON.stringify(lv):'');
  return lv;
}
function runBoard(li,ti,pass,style,prebuilt){
  const short=LEVELS[li].short;
  const row={level:short,outcome:OUT[ti].n,pass:pass+1,style:style,
             built:false,stranded:0,rescues:0,won:false,rescueRows:[],bugs:[]};
  let lv=prebuilt||null;
  if(lv){ SILENT=true;reset();SILENT=false; }
  else{
    try{ lv=buildCached(li,ti,seedFor(short,ti)+pass*104729); }
    catch(e){ row.bugs.push('build threw: '+e.message); return row; }
  }
  if(!lv)return row;
  row.built=true; row.verified=(lv.usedMode!==4);

  srand(9176+pass*613+li*37+ti*11+STYLES.indexOf(style)*7);
  SILENT=true;
  try{ botRun(style,900); }catch(e){ row.bugs.push('core play threw: '+e.message); }
  SILENT=false;
  const stranded=N-cl.size;
  row.stranded=stranded;
  if(stranded===0){row.coreWon=true;return row;}   // core said lose but the bot cleared it

  let emptyRun=0;
  for(let t=0;t<limitRescues();t++){
    if(N-cl.size===0)break;
    const n=(t%2===0)?3:5, src=(n===3)?'ad':'coins';
    const before=N-cl.size;
    SILENT=true;
    try{ ecStart(n,src); }catch(e){ row.bugs.push('ecStart threw: '+e.message); SILENT=false; break; }
    if(!EC){SILENT=false;break;}
    const snapshot={run:EC.run,mode:EC.mode,intent:EC.intent,stated:EC.chance,
                    target:EC.target,feasible:EC.feasible,frust:EC.frust||0,
                    source:EC.source,granted:EC.cards};
    try{ botRun(style,400); }catch(e){ row.bugs.push('rescue play threw: '+e.message); }
    SILENT=false;
    const after=N-cl.size, won=(after===0);
    const dealt=EC.story.length;
    const dead=EC.story.filter(function(s){return s.cleared===0;}).length;
    let r2=0,worstBlank=0;
    EC.story.forEach(function(s){if(s.cleared===0){r2++;if(r2>worstBlank)worstBlank=r2;}else r2=0;});
    if(EC.cleared===0)emptyRun++;else emptyRun=0;
    row.rescueRows.push({
      level:short,outcome:OUT[ti].n,pass:pass+1,style:style,
      rescueNo:snapshot.run,source:snapshot.source==='ad'?'+3 ad':'+5 coins',
      granted:snapshot.granted,mode:snapshot.mode,intent:snapshot.intent,
      statedPct:snapshot.stated,targetPct:snapshot.target,
      feasible:snapshot.feasible?'yes':'no',frustBefore:snapshot.frust,
      boardBefore:before,boardAfter:after,cardsDealt:dealt,
      cardsCleared:EC.cleared,cardsOpened:EC.opened,deadCards:dead,
      worstBlankRun:worstBlank,emptyRunNow:emptyRun,unspent:EC.spare,
      quality:ecQuality(),outcome2:ecOutcome(),won:won?'yes':'no'});
    row.rescues++;
    // invariants
    if(snapshot.intent!=='win'&&won)row.bugs.push('gate breach: '+snapshot.intent+' intent won');
    if(supplyBad())row.bugs.push('supply oversubscribed');
    if(won){row.won=true;break;}
  }
  return row;
}
function limitRescues(){return ${MAX_RESCUE};}
function supplyBad(){
  const core=4*Math.ceil((N+DECKN)/52), t={};
  for(let i=0;i<N;i++)if(LV.rank[i]!==undefined&&!(ECSUP.tab&&ECSUP.tab[i]))
    t[LV.rank[i]]=(t[LV.rank[i]]||0)+1;
  for(let p=0;p<dk.length;p++)if(!dk[p][3])t[dk[p][1]]=(t[dk[p][1]]||0)+1;
  t[LV.seed]=(t[LV.seed]||0)+1;
  for(const r in t)if(t[r]>core)return true;
  const rcap=4*Math.ceil(Math.max(1,ECGRANTED+((ECSUP.n)||0))/13);
  if(ECSUP.r)for(const r in ECSUP.r)if(ECSUP.r[r]>rcap)return true;
  return false;
}

// ---------------------------------------------------------------------------
// RUN
// ---------------------------------------------------------------------------
// ---- fold in any levels supplied on the command line -------------------------
RESULT.loaded=[];RESULT.badLevels=[];
if(global.__levelFiles && global.__levelFiles.length){
  const parsed=[];
  global.__levelFiles.forEach(function(f){
    try{ parsed.push(parseLevel(f.name, JSON.parse(f.text))); }
    catch(e){ RESULT.badLevels.push(f.name+' \u2014 could not parse: '+e.message); }});
  parsed.sort(natsort);
  if(global.__onlyLoaded)LEVELS.length=0;
  parsed.forEach(function(l){
    LEVELS.push(l);
    RESULT.loaded.push(l.short);
    if(l.warn&&l.warn.length)RESULT.badLevels.push(l.short+' \u2014 '+l.warn.join('; '));
    if(l.scrollInferred)RESULT.badLevels.push(l.short+
      ' \u2014 IsScrollableLevel missing, inferred '+(l.scroll?'scrolling':'fixed'));});
}
if(!LEVELS.length)throw new Error('no levels to run');

ecApplyIntensity(${INTENSITY});
const boards=[],rescues=[];
const LOSE_OUTCOMES=[3,4];       // Close Lose, Comfortable Lose
let cleared=0;
global.__begin(${PASSES}*LEVELS.length*LOSE_OUTCOMES.length*STYLES.length,
  {levels:LEVELS.length,outcomes:LOSE_OUTCOMES.length,styles:STYLES.length,
   loaded:RESULT.loaded.length});
for(let pass=0;pass<${PASSES};pass++){
  for(let li=0;li<LEVELS.length;li++){
    for(const ti of LOSE_OUTCOMES){
      let lv=null;
      try{ lv=buildCached(li,ti,seedFor(LEVELS[li].short,ti)+pass*104729); }
      catch(e){ lv=null; }
      for(const style of STYLES){
        const r=runBoard(li,ti,pass,style,lv);
        boards.push(r);
        r.rescueRows.forEach(function(x){rescues.push(x);if(x.won==='yes')cleared++;});
        global.__tick(boards.length,rescues.length,cleared);
      }
    }
  }
}
global.__endProgress();
RESULT.boards=boards;
RESULT.rescues=rescues;
RESULT.tune={intensity:EC_TUNE.intensity,base:EC_TUNE.base,inc:EC_TUNE.inc,
  cap:EC_TUNE.cap,floor:EC_TUNE.floor,holdAlmost:EC_TUNE.holdAlmost,
  holdProgress:EC_TUNE.holdProgress,minAllow:EC_TUNE.minAllow,
  frustCap:EC_TUNE.frustCap,deadPull:EC_TUNE.deadPull,band:EC_TUNE.band,
  floorFirst:EC_TUNE.floorFirst,paceSlack:EC_TUNE.paceSlack,
  maxDeadRun:EC_RULES.maxDeadRun,minLive:EC_RULES.minLive};
RESULT.levels=LEVELS.map(function(L){return L.short;});
RESULT.levelInfo=LEVELS.map(function(L){return {short:L.short,N:L.N,deckN:L.deckN,
  scroll:!!L.scroll,loaded:RESULT.loaded.indexOf(L.short)>=0};});
RESULT.modes=EC_MODES.map(function(x){return [x.id,x.n];});
`);

// ---- reporting --------------------------------------------------------------
const B=RESULT.boards, R=RESULT.rescues, T=RESULT.tune;
const built=B.filter(b=>b.built && !b.coreWon && b.stranded>0);
const pct=(a,b)=>b?((100*a/b).toFixed(0)+'%'):'—';
const avg=(arr,f)=>arr.length?(arr.reduce((s,x)=>s+f(x),0)/arr.length):0;
const modeName={}; RESULT.modes.forEach(([id,n])=>modeName[id]=n);

function group(rows,key){const g={};rows.forEach(r=>{const k=key(r);(g[k]=g[k]||[]).push(r);});return g;}
function statBlock(rows){
  if(!rows.length)return null;
  const dealt=rows.reduce((s,r)=>s+r.cardsDealt,0);
  const dead=rows.reduce((s,r)=>s+r.deadCards,0);
  return {
    n:rows.length,
    won:rows.filter(r=>r.won==='yes').length,
    winPct:100*rows.filter(r=>r.won==='yes').length/rows.length,
    dealt:dealt, dead:dead, deadPct:dealt?100*dead/dealt:0,
    clearedPer:avg(rows,r=>r.cardsCleared),
    dealtPer:avg(rows,r=>r.cardsDealt),
    empty:rows.filter(r=>r.cardsCleared===0).length,
    emptyPct:100*rows.filter(r=>r.cardsCleared===0).length/rows.length,
    quality:avg(rows,r=>r.quality),
    worstBlank:Math.max(0,...rows.map(r=>r.worstBlankRun)),
    stated:avg(rows,r=>r.statedPct)
  };
}
function tableFor(g,label){
  const keys=Object.keys(g).sort();
  let out='| '+label+' | rescues | cleared | dead cards | empty rescues | cleared/rescue | avg quality |\n';
  out+='|---|---|---|---|---|---|---|\n';
  keys.forEach(k=>{const s=statBlock(g[k]);
    out+='| '+k+' | '+s.n+' | '+s.winPct.toFixed(0)+'% | '+s.deadPct.toFixed(0)+'% | '+
      s.emptyPct.toFixed(0)+'% | '+s.clearedPer.toFixed(1)+' | '+s.quality.toFixed(0)+' |\n';});
  return out;
}

const all=statBlock(R);
const bugs=[];B.forEach(b=>b.bugs.forEach(x=>bugs.push(b.level+' '+b.outcome+' ('+b.style+'): '+x)));
const bugCount={};bugs.forEach(x=>{const k=x.replace(/^[^:]+: /,'');bugCount[k]=(bugCount[k]||0)+1;});

// rescues needed to clear
const perBoard=group(built,b=>b.level+'|'+b.outcome+'|'+b.pass+'|'+b.style);
const need={};let cleared=0,abandoned=0;
Object.values(perBoard).forEach(([b])=>{
  if(b.won){need[b.rescues]=(need[b.rescues]||0)+1;cleared++;}
  else{need['never']=(need['never']||0)+1;abandoned++;}});

// ladder honesty
const byRung=group(R,r=>r.rescueNo);
// consecutive empty streaks
let worstEmpty=0;Object.values(perBoard).forEach(([b])=>{
  let run=0;b.rescueRows.forEach(r=>{if(r.cardsCleared===0){run++;if(run>worstEmpty)worstEmpty=run;}else run=0;});});

let md='';
md+='# Extra Card Experience Director — bot report\n\n';
md+='Intensity **'+T.intensity.toFixed(2)+'**. '+PASSES+' passes over all '+RESULT.levels.length+
    ' levels against both losing outcomes, with four player personalities, buying up to '+
    MAX_RESCUE+' rescues per board.\n\n';
md+='**'+built.length+' boards reached a dead state · '+R.length+' rescues bought · '+
    R.reduce((s,r)=>s+r.cardsDealt,0)+' rescue cards dealt.**\n\n';

md+='## Headline\n\n';
md+='| | |\n|---|---|\n';
md+='| Rescues that cleared the board | **'+all.winPct.toFixed(0)+'%** |\n';
md+='| Boards eventually cleared | **'+pct(cleared,built.length)+'** ('+cleared+' of '+built.length+') |\n';
md+='| Dead cards (matched nothing) | **'+all.deadPct.toFixed(0)+'%** |\n';
md+='| Rescues that cleared nothing at all | **'+all.emptyPct.toFixed(0)+'%** |\n';
md+='| Tableau cards cleared per rescue | **'+all.clearedPer.toFixed(1)+'** |\n';
md+='| Cards dealt per rescue | '+all.dealtPer.toFixed(1)+' of '+
    (avg(R,r=>r.granted)).toFixed(1)+' granted |\n';
md+='| Rescues bought per board | **'+(R.length/built.length).toFixed(2)+'** |\n';
md+='| Worst run of consecutive empty rescues | **'+worstEmpty+'** (cap is '+T.frustCap+') |\n';
md+='| Worst run of blanks inside one rescue | **'+all.worstBlank+'** (rule caps at '+T.maxDeadRun+') |\n';
md+='| Average rescue quality | '+all.quality.toFixed(0)+'/100 |\n\n';

// levels in play, and anything that would not build
md+='## Levels\n\n';
const li_=RESULT.levelInfo||[];
const loadedN=li_.filter(function(x){return x.loaded;}).length;
md+=loadedN? ('**'+loadedN+' loaded from disk**'+(li_.length-loadedN?
     ' plus '+(li_.length-loadedN)+' built-in':' (built-ins excluded)')+'.\n\n')
   : 'Ten built-in levels. No external levels supplied.\n\n';
md+='| Level | cards | deck | scrolling | source | boards run | reached a dead state |\n';
md+='|---|---|---|---|---|---|---|\n';
li_.forEach(function(x){
  const mine=B.filter(function(b){return b.level===x.short;});
  const dead=mine.filter(function(b){return b.built&&!b.coreWon&&b.stranded>0;}).length;
  md+='| '+x.short+' | '+x.N+' | '+x.deckN+' | '+(x.scroll?'yes':'no')+' | '+
      (x.loaded?'loaded':'built-in')+' | '+mine.length+' | '+dead+' |\n';});
md+='\n';
const failed=B.filter(function(b){return !b.built;});
if(failed.length){
  const fg={};failed.forEach(function(b){const k=b.level+' \u00b7 '+b.outcome;fg[k]=(fg[k]||0)+1;});
  md+='### Combinations that would not build\n\n';
  md+='A level that cannot be built to a target outcome never reaches the rescue at all.\n\n';
  md+='| Level and outcome | attempts |\n|---|---|\n';
  Object.keys(fg).sort().forEach(function(k){md+='| '+k+' | '+fg[k]+' |\n';});
  md+='\n';
}
const coreWonN=B.filter(function(b){return b.coreWon;}).length;
if(coreWonN)md+='_'+coreWonN+' boards were cleared by the bot despite a losing target, so no rescue was offered._\n\n';
if(RESULT.badLevels&&RESULT.badLevels.length){
  md+='### Level file notes\n\n';
  RESULT.badLevels.forEach(function(x){md+='- '+x+'\n';});
  md+='\n';
}

md+='## Safety invariants\n\n';
const breaches=bugs.filter(x=>/gate breach/.test(x)).length;
const supply=bugs.filter(x=>/supply/.test(x)).length;
const threw=bugs.filter(x=>/threw/.test(x)).length;
md+='| Invariant | Result |\n|---|---|\n';
md+='| A rescue told to fall short never wins | '+(breaches?'**'+breaches+' BREACHES**':'**0 breaches** — holds')+' |\n';
md+='| Rank supply never oversubscribed | '+(supply?'**'+supply+' violations**':'**0 violations**')+' |\n';
md+='| No exceptions during play | '+(threw?'**'+threw+' thrown**':'**0 thrown**')+' |\n\n';
if(Object.keys(bugCount).length){
  md+='Issues seen:\n\n';
  Object.keys(bugCount).forEach(k=>{md+='- '+k+' \u00d7'+bugCount[k]+'\n';});
  md+='\n';
}

md+='## Is the advertised number honest?\n\n';
md+='The offer tells the player their odds. This compares what was shown against what happened.\n\n';
md+='| Rescue # | n | shown | actually cleared | gap |\n|---|---|---|---|---|\n';
let gapSum=0,gapN=0;
Object.keys(byRung).sort((a,b)=>a-b).forEach(k=>{
  const rows=byRung[k];if(rows.length<10)return;
  const st=avg(rows,r=>r.statedPct), ac=100*rows.filter(r=>r.won==='yes').length/rows.length;
  gapSum+=Math.abs(st-ac);gapN++;
  md+='| '+k+' | '+rows.length+' | '+st.toFixed(0)+'% | '+ac.toFixed(0)+'% | '+
      (ac-st>=0?'+':'')+(ac-st).toFixed(0)+' |\n';});
md+='\nMean absolute gap: **'+(gapN?(gapSum/gapN).toFixed(1):'—')+' points**.\n\n';

const byIntent=group(R,r=>r.intent);
md+='| Intent chosen | rescues | actually cleared |\n|---|---|---|\n';
Object.keys(byIntent).sort().forEach(k=>{const rows=byIntent[k];
  md+='| '+k+' | '+rows.length+' | '+pct(rows.filter(r=>r.won==='yes').length,rows.length)+' |\n';});
md+='\n';

md+='## How many rescues does a board take?\n\n';
md+='| Rescues bought | boards |\n|---|---|\n';
Object.keys(need).sort((a,b)=>(a==='never'?99:+a)-(b==='never'?99:+b)).forEach(k=>{
  md+='| '+(k==='never'?'never cleared ('+MAX_RESCUE+' bought)':k)+' | '+need[k]+
      ' ('+pct(need[k],built.length)+') |\n';});
md+='\n';

md+='## By core outcome\n\n'+tableFor(group(R,r=>r.outcome),'Core outcome');
md+='\n## By rescue type\n\n'+tableFor(group(R,r=>r.source),'Bought');
md+='\n_+3 and +5 carry the same odds by design; they differ in variance and pacing._\n';
md+='\n## By player personality\n\n'+tableFor(group(R,r=>r.style),'Plays like');
md+='\n_If the director only holds up for one of these, it is overfitted to that player._\n';
md+='\n## By board size when the rescue was bought\n\n';
md+=tableFor(group(R,r=>r.boardBefore<=3?'1-3 cards left':(r.boardBefore<=6?'4-6 cards left':'7+ cards left')),'Board');
md+='\n## By level\n\n'+tableFor(group(R,r=>r.level),'Level');
md+='\n## Experience modes used\n\n'+tableFor(group(R,r=>modeName[r.mode]||r.mode),'Mode');

// where the satisfaction rules could not be honoured
md+='\n## Where the rules could not be enforced\n\n';
md+='`maxDeadRun` caps blanks in a row at '+T.maxDeadRun+' and `minLive` guarantees one card\n';
md+='that does something. Neither can fire when every card that would clear also wins the\n';
md+='board, which is the case on a board of one or two cards. This is where that bites.\n\n';
const overRule=R.filter(r=>r.worstBlankRun>T.maxDeadRun);
md+='| | rescues | over the blank-run cap | fully empty |\n|---|---|---|---|\n';
[['1-2 cards left',r=>r.boardBefore<=2],['3-6 cards left',r=>r.boardBefore>=3&&r.boardBefore<=6],
 ['7+ cards left',r=>r.boardBefore>=7]].forEach(([lab,f])=>{
  const rows=R.filter(f);if(!rows.length)return;
  md+='| '+lab+' | '+rows.length+' | '+pct(rows.filter(r=>r.worstBlankRun>T.maxDeadRun).length,rows.length)+
      ' | '+pct(rows.filter(r=>r.cardsCleared===0).length,rows.length)+' |\n';});
md+='\n**'+pct(overRule.length,R.length)+' of all rescues exceeded the blank-run cap.**\n\n';

md+='### Blanks in a row, within one rescue\n\n| run length | rescues |\n|---|---|\n';
const blankDist={};R.forEach(r=>{blankDist[r.worstBlankRun]=(blankDist[r.worstBlankRun]||0)+1;});
Object.keys(blankDist).sort((a,b)=>a-b).forEach(k=>{
  md+='| '+k+(+k>T.maxDeadRun?' (over cap)':'')+' | '+blankDist[k]+' ('+pct(blankDist[k],R.length)+') |\n';});

md+='\n### Empty rescues in a row, across a board\n\n';
md+='A player paying repeatedly and getting nothing at all. `frustCap` is '+T.frustCap+
    ' at this intensity.\n\n| streak | times |\n|---|---|\n';
const streakDist={};
Object.values(perBoard).forEach(([b])=>{let run=0,worst=0;
  b.rescueRows.forEach(r=>{if(r.cardsCleared===0){run++;if(run>worst)worst=run;}else run=0;});
  if(worst>0)streakDist[worst]=(streakDist[worst]||0)+1;});
Object.keys(streakDist).sort((a,b)=>a-b).forEach(k=>{
  md+='| '+k+' | '+streakDist[k]+' |\n';});

md+='\n## Rescue outcomes\n\n| Outcome | count | share |\n|---|---|---|\n';
const byOut=group(R,r=>r.outcome2);
Object.keys(byOut).sort((a,b)=>byOut[b].length-byOut[a].length).forEach(k=>{
  md+='| '+k+' | '+byOut[k].length+' | '+pct(byOut[k].length,R.length)+' |\n';});

md+='\n## Tuning used\n\n```\n';
Object.keys(T).forEach(k=>{md+=k.padEnd(14)+String(T[k])+'\n';});
md+='```\n\nRe-run: `node eced_bot.js '+INTENSITY+' '+PASSES+' '+MAX_RESCUE+'`\n';

fs.writeFileSync(path.join(__dirname,'eced_report.md'),md);

const cols=Object.keys(R[0]||{level:1});
const q=v=>'"'+String(v).replace(/"/g,'""')+'"';
const csv=[cols.map(q).join(',')].concat(R.map(r=>cols.map(c=>q(r[c])).join(','))).join('\r\n');
fs.writeFileSync(path.join(__dirname,'eced_rescues.csv'),'\ufeff'+csv);

console.log('  done in '+hms((Date.now()-T0)/1000));
console.log('');
console.log('  boards to dead state: '+built.length+'   rescues: '+R.length);
console.log('  cleared '+all.winPct.toFixed(0)+'%   dead '+all.deadPct.toFixed(0)+
  '%   empty '+all.emptyPct.toFixed(0)+'%   cleared/rescue '+all.clearedPer.toFixed(1));
console.log('  gate breaches: '+breaches+'   supply: '+supply+'   exceptions: '+threw);
console.log('  worst empty streak: '+worstEmpty+'   worst blank run: '+all.worstBlank);
console.log('');
if(CDIRTY){try{fs.writeFileSync(CACHE_FILE,JSON.stringify(CACHE));}catch(e){}}
console.log('  levels needed '+(CHIT+CMISS)+': '+CHIT+' from cache, '+CMISS+' generated');
console.log('');
console.log('  wrote  '+path.join(__dirname,'eced_report.md'));
console.log('  wrote  '+path.join(__dirname,'eced_rescues.csv'));
console.log('');
