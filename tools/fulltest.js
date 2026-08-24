// FULL DIRECTOR TEST
//   25 levels x 5 outcomes x 5 plays = 625 runs
//   streak reward +1 extra card, intensity 0.5
//
//   node fulltest.js [passes] [chunkFrom] [chunkTo]
//
// Builds are cached to disk between invocations, so a long run can be taken in stages.

const fs=require('fs'),path=require('path'),crypto=require('crypto');
const PASSES=parseInt(process.argv[2]||'5',10);
const FROM=parseInt(process.argv[3]||'0',10);
const TO=parseInt(process.argv[4]||'999',10);
const CACHE_FILE=path.join(__dirname,'.full_cache.json');
const ACC_FILE=path.join(__dirname,'.full_rows.json');

const src=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const HASH=crypto.createHash('sha1').update(src).digest('hex').slice(0,12);
let CACHE={ver:HASH,levels:{}};
if(fs.existsSync(CACHE_FILE)){try{const c=JSON.parse(fs.readFileSync(CACHE_FILE,'utf8'));
  if(c.ver===HASH)CACHE=c;}catch(e){}}
let CHIT=0,CMISS=0;
global.__cget=k=>{const v=CACHE.levels[k];if(v!==undefined){CHIT++;return v;}CMISS++;return null;};
global.__cset=(k,v)=>{CACHE.levels[k]=v;};

const m=src.match(/<script>\n"use strict";([\s\S]*?)<\/script>/);
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

const t0=Date.now();
let ROWS=null;
eval(js + `
function deNull(lv){
  if(Array.isArray(lv.LB))for(let i=0;i<lv.LB.length;i++)if(lv.LB[i]===null)delete lv.LB[i];
  if(lv.base&&Array.isArray(lv.base.LB))
    for(let i=0;i<lv.base.LB.length;i++)if(lv.base.LB[i]===null)delete lv.base.LB[i];
  if(lv.rank)for(const i in lv.rank)if(lv.rank[i]===null)delete lv.rank[i];
  if(lv.base&&lv.base.rank)for(const i in lv.base.rank)if(lv.base.rank[i]===null)delete lv.base.rank[i];
  return lv;
}
function buildCached(li,ti,seed){
  const key=LEVELS[li].short+'|'+ti+'|'+seed;
  const hit=global.__cget(key);
  if(hit!==null){
    if(hit==='')return null;
    useLevel(li);document.getElementById('tsel').value=String(ti);
    LV=deNull(JSON.parse(hit));LV.tgt=OUT[ti];LV.ti=ti;
    SILENT=true;reset();SILENT=false;return LV;
  }
  let lv=null;
  try{ lv=buildFixed(li,ti,seed); }catch(e){ global.__cset(key,''); return null; }
  global.__cset(key,lv?JSON.stringify(lv):'');
  return lv;
}
ecApplyIntensity(0.5);
STREAK_REWARD.type='ExtraCards';STREAK_REWARD.amount=1;

const rows=[];
for(let li=${FROM};li<Math.min(LEVELS.length,${TO});li++){
  for(let ti=0;ti<OUT.length;ti++){
    for(let p=0;p<${PASSES};p++){
      const lv=buildCached(li,ti,seedFor(LEVELS[li].short,ti)+p*104729);
      const row={level:LEVELS[li].short,N:LEVELS[li].N,deckN:LEVELS[li].deckN,
        outcome:OUT[ti].n,ti:ti,pass:p,built:!!lv,
        mode:lv?lv.usedMode:null,tvBuild:lv?lv.tv:null,
        wantWin:OUT[ti].win,lo:OUT[ti].lo,hi:OUT[ti].hi};
      if(!lv){rows.push(row);continue;}
      srand(6100+li*53+ti*17+p*7);
      SILENT=true;
      let res=null,threw=null;
      try{
        for(let mv=0;mv<1200;mv++){
          if(N-cl.size===0){res={win:true,v:deckLeft()};break;}
          const lg=legals();
          if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
          else if(deckLeft()>0)draw();
          else {res={win:false,v:N-cl.size};break;}
        }
      }catch(e){threw=e.message;}
      SILENT=false;
      row.threw=threw;
      row.gotWin=res?res.win:null; row.value=res?res.v:null;
      row.tvEnd=LV.tv;
      row.streaks=STREAK_LOG.length;
      row.granted=STREAK_GRANTED;
      row.supplyChanges=SUPPLY_LOG.length;
      row.rungs=SUPPLY_LOG.map(function(c){return c.status;}).join('/');
      // now the rescue phase, if the board did not clear
      row.rescues=[];
      if(res&&!res.win){
        for(let t=0;t<8&&N-cl.size>0;t++){
          const before=N-cl.size;
          SILENT=true;
          try{ ecStart(t%2?5:3,t%2?'coins':'ad'); }catch(e){ SILENT=false; break; }
          if(!EC){SILENT=false;break;}
          const intent=EC.intent,stated=EC.chance,dry=!!EC.dry,mode=EC.mode;
          try{
            for(let mv=0;mv<500;mv++){
              if(N-cl.size===0)break;
              const lg=legals();
              if(lg.length)play(lg[Math.floor(rnd()*lg.length)]);
              else if(deckLeft()>0)draw();
              else break;
            }
          }catch(e){}
          SILENT=false;
          let r2=0,mx=0;
          EC.story.forEach(function(x){if(x.cleared===0){r2++;if(r2>mx)mx=r2;}else r2=0;});
          row.rescues.push({before:before,intent:intent,stated:stated,dry:dry,mode:mode,
            dealt:EC.story.length,cleared:EC.cleared,
            dead:EC.story.filter(function(x){return x.cleared===0;}).length,
            blank:mx,won:N-cl.size===0});
          if(N-cl.size===0)break;
        }
      }
      row.rescueWon=(N-cl.size===0);
      // invariants
      const bad=[];
      const core=4*Math.ceil((N+DECKN)/52),t2={};
      for(let i=0;i<N;i++)if(LV.rank[i]!==undefined&&!(ECSUP.tab&&ECSUP.tab[i]))
        t2[LV.rank[i]]=(t2[LV.rank[i]]||0)+1;
      for(let d=0;d<di&&d<dk.length;d++)if(!dk[d][3])t2[dk[d][1]]=(t2[dk[d][1]]||0)+1;
      for(const r in t2)if(t2[r]>core)bad.push('supply '+RN[r]);
      if(LV.pool)for(const r in LV.pool)if(LV.pool[r]<0)bad.push('pool<0');
      row.bugs=bad;
      rows.push(row);
    }
  }
}
ROWS=rows;
`);

fs.writeFileSync(CACHE_FILE,JSON.stringify(CACHE));
let acc=[];
if(fs.existsSync(ACC_FILE)){try{const a=JSON.parse(fs.readFileSync(ACC_FILE,'utf8'));
  if(a.ver===HASH)acc=a.rows;}catch(e){}}
const seen=new Set(acc.map(r=>r.level+'|'+r.ti+'|'+r.pass));
ROWS.forEach(r=>{const k=r.level+'|'+r.ti+'|'+r.pass;if(!seen.has(k)){acc.push(r);seen.add(k);}});
fs.writeFileSync(ACC_FILE,JSON.stringify({ver:HASH,rows:acc}));

console.log('  chunk levels '+FROM+'-'+Math.min(TO,999)+'   runs this call '+ROWS.length+
  '   accumulated '+acc.length+
  '   builds '+CHIT+' cached / '+CMISS+' generated   '+
  Math.round((Date.now()-t0)/1000)+'s');
