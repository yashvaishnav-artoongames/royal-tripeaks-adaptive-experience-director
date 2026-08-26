const ROOT=require('path').join(__dirname,'..','..','index.html');
const BASE=process.env.AED_BASELINE||ROOT;
// PHASE 0, STEP 3 (corrected) — the generator around exh/allHit is time-boxed, so
// comparing whole builds can never be deterministic. Compare the two functions directly
// on identical captured inputs instead. That isolates the radix change from the
// wall-clock search that surrounds it.

const fs=require('fs'),vm=require('vm');
function ctx(file){
  const src=fs.readFileSync(file,'utf8');
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
  const s={document:{getElementById:id=>store[id]||(store[id]=mk(id)),createElement:()=>mk('x'),
      querySelectorAll:()=>[fb,fb],addEventListener:()=>{},
      body:{classList:{add(){},remove(){}},appendChild(){},removeChild(){}}},
    window:{addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},
    setTimeout:()=>0,console:console,IN:null,OUTP:null};
  vm.createContext(s); vm.runInContext(js,s); return s;
}

// STAGE-0 VARIANT. Every built-in level now carries an obstacle, so every one is steered
// live, so genLive returns an empty deck and the capture below skips all of them - the
// harness compares nothing and reports agreement, which is the ISSUE-001 shape exactly.
// Stripping the obstacle fields in BOTH contexts gives the prover levels it owns, on the
// same real geometry, which is what the comparison needs.
const STRIP=`LEVELS.forEach(function(L){delete L.plus;delete L.wild;delete L.dbl;
  delete L.lock;delete L.key;delete L.ud;});`;
const A=ctx(BASE);   // old radix
const B=ctx(ROOT);
vm.runInContext(STRIP,A);vm.runInContext(STRIP,B);          // new radix

// 1. capture real inputs from real builds, in the OLD context
vm.runInContext(`
IN=[];
for(let li=0;li<LEVELS.length;li++){
  for(let ti=0;ti<OUT.length;ti++){
    let lv=null;
    try{ lv=buildFixed(li,ti,seedFor(LEVELS[li].short,ti)); }catch(e){ continue; }
    if(!lv||!lv.deck||!lv.deck.length)continue;
    const M=maskOf();
    IN.push({li:li,ti:ti,N:N,
      rank:Object.keys(lv.rank).map(k=>lv.rank[k]),
      deck:lv.deck.map(c=>[c[0],c[1],c[2]]),
      seed:lv.seed, win:lv.tgt.win, tv:lv.tv,
      needPay:!!lv.needPay, m0:M[0], m1:M[1]});
  }
}`,A);
const cases=A.IN;
console.log('');
console.log('  captured '+cases.length+' real (rank, deck, target) inputs');

// 2. run both implementations over the same inputs, at several deck growths
function run(s,cases){
  s.CASES=cases;
  vm.runInContext(`
  OUTP=[];
  for(const c of CASES){
    useLevel(c.li);
    document.getElementById('tsel').value=String(c.ti);
    const rank={}; c.rank.forEach(function(v,i){ if(v!==null&&v!==undefined)rank[i]=v; });
    for(const extra of [0,1,2,3,4,6,10]){
      srand(20240101+c.li*97+c.ti*13+extra);
      const deck=c.deck.map(function(x){return x.slice();});
      for(let g=0;g<extra;g++){const r=1+Math.floor(rnd()*13);deck.push([RN[r]+'S',r,false]);}
      const tvNow=c.win ? c.tv+extra : c.tv;
      let e=null,a=null;
      try{ const r=exh(rank,deck,c.seed,c.win,tvNow,c.needPay);
           e = r===null ? 'null' : (r.minDen+'/'+r.minPay+'/'+r.forks); }catch(err){ e='threw'; }
      try{ a=String(allHit(c.m0,c.m1,c.seed,deck,0,c.win,tvNow,rank)); }catch(err){ a='threw'; }
      OUTP.push(c.li+':'+c.ti+':'+extra+' exh='+e+' allHit='+a);
    }
  }`,s);
  return s.OUTP;
}
const ra=run(A,cases), rb=run(B,cases);

let same=0, diff=[];
for(let i=0;i<ra.length;i++){
  if(ra[i]===rb[i])same++; else diff.push({old:ra[i],neu:rb[i]});
}
console.log('  comparisons (7 deck growths each) : '+ra.length);
console.log('  identical                         : '+same);
console.log('  differing                         : '+diff.length);
console.log('');
if(diff.length){
  console.log('  differences:');
  const byGrowth={};
  diff.forEach(d=>{const g=d.old.split(':')[2].split(' ')[0];byGrowth[g]=(byGrowth[g]||0)+1;});
  console.log('  by cards added: '+JSON.stringify(byGrowth));
  diff.slice(0,12).forEach(d=>console.log('    old  '+d.old+'\n    new  '+d.neu));
} else {
  console.log('  The two implementations agree on every input at every deck growth.');
}
console.log('');
